const hre = require("hardhat");

async function main() {
    const fusioToken =  await hre.ethers.getContractFactory("contracts/FusioToken.sol:FusioToken");
    console.log("Deployment started");
    const FusioToken =  await upgrades.deployProxy(fusioToken, ["Fusio", "FIO", "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F", "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F"], {
        initializer: "initialize",
    });
    await FusioToken.waitForDeployment();
    const deployedAddress = await FusioToken.getAddress();
    console.log("Fusio token contract deployed to", deployedAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});