const hre = require("hardhat");

async function main() {
    const fusioToken =  await hre.ethers.getContractFactory("contracts/FusioToken.sol:FusioToken");
    console.log("Deployment started");
    const FusioToken =  await fusioToken.deploy();
    await FusioToken.waitForDeployment();
    const deployedAddress = await FusioToken.getAddress();
    console.log("Implementation Contract deployed to", deployedAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});