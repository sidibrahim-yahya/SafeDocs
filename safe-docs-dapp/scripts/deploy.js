const hre = require("hardhat");

async function main() {
  console.log("🚀 Déploiement du contrat SafeDocs...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", hre.ethers.formatEther(balance), "ETH\n");

  const SafeDocs = await hre.ethers.getContractFactory("SafeDocs");
  console.log("⏳ Déploiement en cours...");
  
  const safeDocs = await SafeDocs.deploy();
  await safeDocs.waitForDeployment();

  const contractAddress = await safeDocs.getAddress();
  console.log("✅ SafeDocs déployé à l'adresse:", contractAddress);
  
  console.log("\n📋 Informations de déploiement:");
  console.log("   - Network:", hre.network.name);
  console.log("   - Contract Address:", contractAddress);
  console.log("   - Deployer:", deployer.address);
  
  console.log("\n💾 Sauvegarde de l'adresse du contrat...");
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Informations sauvegardées dans deployment-info.json");
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Attente de 30 secondes avant la vérification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("🔍 Vérification du contrat sur Etherscan...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contrat vérifié sur Etherscan!");
    } catch (error) {
      console.log("⚠️  Erreur lors de la vérification:", error.message);
    }
  }
  
  console.log("\n🎉 Déploiement terminé avec succès!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });

