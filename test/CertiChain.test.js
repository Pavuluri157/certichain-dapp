const { expect } = require("chai");
const ganache = require("ganache");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

describe("CertiChain", function () {
  let ganacheProvider;
  let provider;
  let owner;
  let outsider;
  let contract;

  beforeEach(async function () {
    ganacheProvider = ganache.provider({
      logging: { quiet: true },
      wallet: { deterministic: true },
      chain: { chainId: 1337 }
    });
    provider = new ethers.BrowserProvider(ganacheProvider);
    owner = await provider.getSigner(0);
    outsider = await provider.getSigner(1);

    const artifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "build", "CertiChain.json"), "utf8")
    );
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  afterEach(async function () {
    await ganacheProvider.disconnect();
  });

  it("accepts valid input and stores certificate data", async function () {
    const id = ethers.id("CERT-2026-001");
    await (await contract.issueCertificate(id, "Aarav Sharma", "Blockchain Technology")).wait();

    const certificate = await contract.getCertificate(id);
    expect(certificate.studentName).to.equal("Aarav Sharma");
    expect(certificate.courseName).to.equal("Blockchain Technology");
    expect(certificate.issuer).to.equal(await owner.getAddress());
    expect(certificate.revoked).to.equal(false);
    expect(certificate.exists).to.equal(true);
    expect(await contract.certificateCount()).to.equal(1n);
  });

  it("rejects invalid empty student input", async function () {
    const id = ethers.id("CERT-2026-002");
    await expectRevert(
      contract.issueCertificate(id, "", "Blockchain Technology"),
      "Student name cannot be empty"
    );
  });

  it("rejects a duplicate certificate ID", async function () {
    const id = ethers.id("CERT-2026-003");
    await (await contract.issueCertificate(id, "Meera Nair", "Blockchain Technology")).wait();
    await expectRevert(
      contract.issueCertificate(id, "Different Student", "Another Course"),
      "Certificate already exists"
    );
  });

  it("rejects an unauthorised issuer", async function () {
    const id = ethers.id("CERT-2026-004");
    await expectRevert(
      contract.connect(outsider).issueCertificate(id, "Kabir Rao", "Blockchain Technology"),
      "Only the institution owner can perform this action"
    );
  });

  it("allows the owner to revoke an issued certificate", async function () {
    const id = ethers.id("CERT-2026-005");
    await (await contract.issueCertificate(id, "Anaya Iyer", "Blockchain Technology")).wait();
    await (await contract.revokeCertificate(id)).wait();
    const certificate = await contract.getCertificate(id);
    expect(certificate.revoked).to.equal(true);
  });

  it("rejects revocation of a missing certificate", async function () {
    await expectRevert(
      contract.revokeCertificate(ethers.id("MISSING")),
      "Certificate does not exist"
    );
  });
});

async function expectRevert(promise, expectedMessage) {
  try {
    await promise;
    expect.fail("Expected the transaction to revert");
  } catch (error) {
    const diagnostic = `${String(error)} ${JSON.stringify(error)}`;
    expect(diagnostic).to.include(expectedMessage);
  }
}
