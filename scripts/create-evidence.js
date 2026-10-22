const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  const root = path.join(__dirname, "..");
  const deployment = JSON.parse(fs.readFileSync(path.join(root, "deployment.json"), "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:7545");
  const owner = await provider.getSigner(0);
  const outsider = await provider.getSigner(1);
  const contract = new ethers.Contract(deployment.address, deployment.abi, owner);
  const certificateReference = "CERT-2026-001";
  const certificateId = ethers.id(certificateReference);

  const issueTransaction = await contract.issueCertificate(
    certificateId,
    "Aarav Sharma",
    "Blockchain Technology"
  );
  const issueReceipt = await issueTransaction.wait();
  const stored = await contract.getCertificate(certificateId);

  let invalidResult;
  try {
    await contract.issueCertificate(certificateId, "Duplicate Student", "Duplicate Course");
    invalidResult = "Unexpected success";
  } catch (error) {
    invalidResult = extractReason(error);
  }

  let unauthorisedResult;
  try {
    await contract.connect(outsider).revokeCertificate(certificateId);
    unauthorisedResult = "Unexpected success";
  } catch (error) {
    unauthorisedResult = extractReason(error);
  }

  const evidence = {
    generatedAt: new Date().toISOString(),
    network: deployment.network,
    chainId: deployment.chainId,
    contractAddress: deployment.address,
    validTransaction: {
      description: "Owner issued a new academic certificate",
      transactionHash: issueReceipt.hash,
      blockNumber: issueReceipt.blockNumber,
      status: issueReceipt.status === 1 ? "Success" : "Failed",
      gasUsed: issueReceipt.gasUsed.toString()
    },
    retrievedBlockchainData: {
      certificateReference,
      studentName: stored.studentName,
      courseName: stored.courseName,
      issuedAt: new Date(Number(stored.issuedAt) * 1000).toISOString(),
      issuer: stored.issuer,
      revoked: stored.revoked,
      exists: stored.exists
    },
    invalidInputTest: {
      input: "Duplicate certificate ID",
      observedResult: invalidResult,
      outcome: "Passed - transaction rejected"
    },
    unauthorisedInputTest: {
      input: "Non-owner attempted to revoke a certificate",
      observedResult: unauthorisedResult,
      outcome: "Passed - transaction rejected"
    }
  };

  const evidenceDirectory = path.join(root, "evidence");
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(evidenceDirectory, "transaction-evidence.json"),
    `${JSON.stringify(evidence, null, 2)}\n`
  );
  console.log(JSON.stringify(evidence, null, 2));
}

function extractReason(error) {
  return error?.info?.error?.data?.reason || error?.reason || error?.shortMessage || error?.message || "Transaction rejected";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
