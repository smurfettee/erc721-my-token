const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying MyNFT contract...");
    
    // Replace with your actual IPFS base URI
    const baseURI = "ipfs://QmYourHashHere/";
    
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy(baseURI);
    
    await myNFT.waitForDeployment();
    
    const contractAddress = await myNFT.getAddress();
    console.log("MyNFT deployed to:", contractAddress);
    console.log("Base URI set to:", baseURI);
    
    // Verify contract on Etherscan (optional)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("Waiting for block confirmations...");
        await myNFT.deploymentTransaction().wait(6);
        
        console.log("Verifying contract...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [baseURI],
            });
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });