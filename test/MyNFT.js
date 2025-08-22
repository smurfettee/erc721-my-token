const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
    let myNFT;
    let owner;
    let addr1;
    let addr2;
    const baseURI = "ipfs://QmTestHash/";
    const mintFee = ethers.parseEther("0.01");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        const MyNFT = await ethers.getContractFactory("MyNFT");
        myNFT = await MyNFT.deploy(baseURI);
        await myNFT.waitForDeployment();
    });

    describe("Minting", function () {
        it("Should allow minting with correct fee", async function () {
            await expect(myNFT.connect(addr1).mint({ value: mintFee }))
                .to.emit(myNFT, "Minted")
                .withArgs(addr1.address, 1);
            
            expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
            expect(await myNFT.hasMinted(addr1.address)).to.be.true;
            expect(await myNFT.totalSupply()).to.equal(1);
        });

        it("Should only allow 1 NFT per wallet", async function () {
            // First mint should succeed
            await myNFT.connect(addr1).mint({ value: mintFee });
            
            // Second mint from same address should fail
            await expect(myNFT.connect(addr1).mint({ value: mintFee }))
                .to.be.revertedWith("Address has already minted");
        });

        it("Should revert when minting without enough ETH", async function () {
            const insufficientFee = ethers.parseEther("0.005");
            
            await expect(myNFT.connect(addr1).mint({ value: insufficientFee }))
                .to.be.revertedWith("Insufficient ETH sent");
        });

        it("Should allow different addresses to mint", async function () {
            await myNFT.connect(addr1).mint({ value: mintFee });
            await myNFT.connect(addr2).mint({ value: mintFee });
            
            expect(await myNFT.totalSupply()).to.equal(2);
            expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
            expect(await myNFT.ownerOf(2)).to.equal(addr2.address);
        });
    });

    describe("Withdrawal", function () {
        it("Should allow owner to withdraw funds", async function () {
            // Mint some NFTs to accumulate funds
            await myNFT.connect(addr1).mint({ value: mintFee });
            await myNFT.connect(addr2).mint({ value: mintFee });
            
            const contractBalance = await ethers.provider.getBalance(myNFT.target);
            expect(contractBalance).to.equal(mintFee * 2n);
            
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            
            await expect(myNFT.withdraw())
                .to.emit(myNFT, "Withdrawal")
                .withArgs(owner.address, contractBalance);
            
            const contractBalanceAfter = await ethers.provider.getBalance(myNFT.target);
            expect(contractBalanceAfter).to.equal(0);
        });

        it("Should revert withdrawal when no funds", async function () {
            await expect(myNFT.withdraw())
                .to.be.revertedWith("No funds to withdraw");
        });

        it("Should only allow owner to withdraw", async function () {
            await myNFT.connect(addr1).mint({ value: mintFee });
            
            await expect(myNFT.connect(addr1).withdraw())
                .to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
        });
    });

    describe("Metadata", function () {
        it("Should return correct token URI", async function () {
            await myNFT.connect(addr1).mint({ value: mintFee });
            
            const tokenURI = await myNFT.tokenURI(1);
            expect(tokenURI).to.equal(baseURI + "1");
        });

        it("Should allow owner to update base URI", async function () {
            const newBaseURI = "ipfs://QmNewHash/";
            await myNFT.setBaseURI(newBaseURI);
            
            await myNFT.connect(addr1).mint({ value: mintFee });
            const tokenURI = await myNFT.tokenURI(1);
            expect(tokenURI).to.equal(newBaseURI + "1");
        });
    });
});