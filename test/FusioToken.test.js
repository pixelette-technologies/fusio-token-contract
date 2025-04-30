const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FusioToken", function () {
  let FusioToken, token;
  let owner, minter, user, newMinter;

  const NAME = "FusioToken";
  const SYMBOL = "FusioM";
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1B tokens

  beforeEach(async () => {
    [owner, minter, user, newMinter] = await ethers.getSigners();

    const FusioTokenFactory = await ethers.getContractFactory("FusioToken");
    token = await upgrades.deployProxy(FusioTokenFactory, [NAME, SYMBOL, minter.address, owner.address], {
      initializer: "initialize",
    });
    await token.waitForDeployment();
  });

  it("should initialize correctly", async () => {
    expect(await token.name()).to.equal(NAME);
    expect(await token.symbol()).to.equal(SYMBOL);
    expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    expect(await token.minter()).to.equal(minter.address);
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.balanceOf(owner.address)).to.equal(MAX_SUPPLY);
  });

  it("should not allow minting beyond MAX_SUPPLY", async () => {
    const amount = ethers.parseEther("1");

    await expect(token.connect(minter).mint(user.address, amount)).to.be.revertedWith("Mint exceeds MAX_SUPPLY");
  });

  it("should allow burning", async () => {
    await token.connect(owner).transfer(user.address, ethers.parseEther("1000"));
    await token.connect(user).burn(ethers.parseEther("500"));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
  });

  it("should allow pausing and block transfers when paused", async () => {
    await token.connect(owner).pause();

    await expect(
      token.connect(owner).transfer(user.address, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(token, "EnforcedPause");

    await token.connect(owner).unpause();
    await expect(token.connect(owner).transfer(user.address, ethers.parseEther("1"))).to.not.be.reverted;
  });

  it("should allow owner to set a new minter", async () => {
    await expect(
      token.connect(user).setMinter(newMinter.address)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount").withArgs(user.address);
  
    await token.connect(owner).setMinter(newMinter.address);
    expect(await token.minter()).to.equal(newMinter.address);
  });

  it("should revert if minter or owner is zero address during initialization", async () => {
    const Factory = await ethers.getContractFactory("FusioToken");

    await expect(
      upgrades.deployProxy(Factory, [NAME, SYMBOL, ethers.ZeroAddress, owner.address], {
        initializer: "initialize",
      })
    ).to.be.revertedWithCustomError(Factory, "InvalidZeroAddress");

    await expect(
      upgrades.deployProxy(Factory, [NAME, SYMBOL, minter.address, ethers.ZeroAddress], {
        initializer: "initialize",
      })
    ).to.be.revertedWithCustomError(Factory, "InvalidZeroAddress");
  });

  it("should only allow owner to upgrade the contract", async () => {
    const DummyUpgrade = await ethers.getContractFactory("FusioToken");
  
    await expect(
      upgrades.upgradeProxy(token.target, DummyUpgrade.connect(user))
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount").withArgs(user.address);
  });
  
});
