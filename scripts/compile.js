const fs = require("fs");
const path = require("path");
const solc = require("solc");

const root = path.join(__dirname, "..");
const contractPath = path.join(root, "contracts", "CertiChain.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: { "CertiChain.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((item) => item.severity === "error");
if (errors.length) {
  console.error(errors.map((item) => item.formattedMessage).join("\n"));
  process.exit(1);
}

const compiled = output.contracts["CertiChain.sol"].CertiChain;
const artifact = {
  contractName: "CertiChain",
  abi: compiled.abi,
  bytecode: `0x${compiled.evm.bytecode.object}`
};

const buildDirectory = path.join(root, "build");
fs.mkdirSync(buildDirectory, { recursive: true });
fs.writeFileSync(
  path.join(buildDirectory, "CertiChain.json"),
  `${JSON.stringify(artifact, null, 2)}\n`
);
console.log("Compiled CertiChain.sol successfully.");
