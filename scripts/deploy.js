const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  const root = path.join(__dirname, "..");
  const artifact = JSON.parse(
    fs.readFileSync(path.join(root, "build", "CertiChain.json"), "utf8")
  );
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:7545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = await provider.getSigner(0);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = await provider.getNetwork();
  const deployment = {
    contractName: "CertiChain",
    address,
    network: "Ganache Local",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: await signer.getAddress(),
    abi: artifact.abi
  };

  fs.writeFileSync(
    path.join(root, "deployment.json"),
    `${JSON.stringify(deployment, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(root, "frontend", "config.js"),
    `window.CERTICHAIN_CONFIG = ${JSON.stringify({ address, chainId: Number(network.chainId), rpcUrl, abi: artifact.abi }, null, 2)};\n`
  );
  console.log(`CertiChain deployed to ${address}`);
  console.log(`Network chain ID: ${network.chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
