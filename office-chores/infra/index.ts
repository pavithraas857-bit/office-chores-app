import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// ---------------------------------------------------------------------------
// Security Group
// Allows SSH (22), HTTP (80), HTTPS (443) inbound; all outbound.
// ---------------------------------------------------------------------------
const securityGroup = new aws.ec2.SecurityGroup("office-chores-sg", {
    name: "office-chores-sg",
    description: "Allow SSH, HTTP, and HTTPS inbound traffic",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"],
            description: "SSH",
        },
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTP",
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "HTTPS",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "All outbound traffic",
        },
    ],
    tags: { Name: "office-chores-sg" },
});

// ---------------------------------------------------------------------------
// IAM Role — lets EC2 read secrets from SSM Parameter Store
// ---------------------------------------------------------------------------
const ec2Role = new aws.iam.Role("office-chores-ec2-role", {
    name: "office-chores-ec2-role",
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Principal: { Service: "ec2.amazonaws.com" },
                Action: "sts:AssumeRole",
            },
        ],
    }),
    tags: { Name: "office-chores-ec2-role" },
});

new aws.iam.RolePolicyAttachment("office-chores-ssm-policy", {
    role: ec2Role.name,
    policyArn: "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess",
});

const instanceProfile = new aws.iam.InstanceProfile("office-chores-instance-profile", {
    name: "office-chores-instance-profile",
    role: ec2Role.name,
});

// ---------------------------------------------------------------------------
// AMI — latest Amazon Linux 2023 in us-east-1
// ---------------------------------------------------------------------------
const ami = aws.ec2.getAmiOutput({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
        { name: "name", values: ["al2023-ami-*-x86_64"] },
        { name: "architecture", values: ["x86_64"] },
        { name: "virtualization-type", values: ["hvm"] },
    ],
});

// ---------------------------------------------------------------------------
// EC2 Instance — t2.micro, free tier
// ---------------------------------------------------------------------------
const instance = new aws.ec2.Instance("office-chores-ec2", {
    ami: ami.id,
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [securityGroup.id],
    iamInstanceProfile: instanceProfile.name,
    rootBlockDevice: {
        volumeSize: 8,
        volumeType: "gp3",
        deleteOnTermination: true,
    },
    tags: { Name: "office-chores" },
});

// ---------------------------------------------------------------------------
// Elastic IP — stable public IP, free while attached to a running instance
// ---------------------------------------------------------------------------
const eip = new aws.ec2.Eip("office-chores-eip", {
    instance: instance.id,
    domain: "vpc",
    tags: { Name: "office-chores-eip" },
});

// ---------------------------------------------------------------------------
// SSM Parameter Store — secrets (SecureString, encrypted, free tier)
// Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET after getting them from
// Google Cloud Console. SESSION_SECRET should be replaced with a 64-char
// random hex string before running `pulumi up`.
// ---------------------------------------------------------------------------
const ssmParams: { name: string; value: string }[] = [
    { name: "/office-chores/SESSION_SECRET",       value: "REPLACE_ME" },
    { name: "/office-chores/GOOGLE_CLIENT_ID",     value: "REPLACE_ME" },
    { name: "/office-chores/GOOGLE_CLIENT_SECRET", value: "REPLACE_ME" },
    { name: "/office-chores/GOOGLE_CALLBACK_URL",  value: "https://office-chores.duckdns.org/api/auth/google/callback" },
    { name: "/office-chores/CORS_ORIGIN",          value: "https://office-chores.duckdns.org" },
];

for (const param of ssmParams) {
    const logicalName = param.name.replace(/\//g, "-").replace(/^-/, "");
    new aws.ssm.Parameter(logicalName, {
        name: param.name,
        type: "SecureString",
        value: param.value,
        tags: { App: "office-chores" },
    });
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
export const instanceId  = instance.id;
export const elasticIp   = eip.publicIp;
export const publicDns   = instance.publicDns;
