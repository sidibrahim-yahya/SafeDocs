const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SafeDocs", function () {
  let safeDocs;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const SafeDocs = await ethers.getContractFactory("SafeDocs");
    safeDocs = await SafeDocs.deploy();
    await safeDocs.waitForDeployment();
  });

  describe("Déploiement", function () {
    it("Devrait déployer le contrat avec succès", async function () {
      expect(await safeDocs.getAddress()).to.be.properAddress;
    });

    it("Devrait définir le bon owner", async function () {
      expect(await safeDocs.owner()).to.equal(owner.address);
    });

    it("Devrait avoir 0 utilisateurs au départ", async function () {
      expect(await safeDocs.getTotalUsers()).to.equal(0);
    });
  });

  describe("Inscription des utilisateurs", function () {
    it("Devrait permettre à un utilisateur de s'inscrire", async function () {
      await expect(safeDocs.connect(user1).registerUser("Alice"))
        .to.emit(safeDocs, "UserRegistered")
        .withArgs(user1.address, "Alice", await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

      expect(await safeDocs.isUserRegistered(user1.address)).to.be.true;
    });

    it("Ne devrait pas permettre une double inscription", async function () {
      await safeDocs.connect(user1).registerUser("Alice");
      await expect(
        safeDocs.connect(user1).registerUser("Alice2")
      ).to.be.revertedWith("User already registered");
    });

    it("Ne devrait pas accepter un nom d'utilisateur vide", async function () {
      await expect(
        safeDocs.connect(user1).registerUser("")
      ).to.be.revertedWith("Username cannot be empty");
    });

    it("Ne devrait pas accepter un nom d'utilisateur trop long", async function () {
      const longUsername = "a".repeat(51);
      await expect(
        safeDocs.connect(user1).registerUser(longUsername)
      ).to.be.revertedWith("Username too long");
    });

    it("Devrait retourner les bonnes informations utilisateur", async function () {
      await safeDocs.connect(user1).registerUser("Alice");
      const userInfo = await safeDocs.getUserInfo(user1.address);
      
      expect(userInfo[0]).to.equal("Alice");
      expect(userInfo[2]).to.equal(0);
      expect(userInfo[3]).to.be.true;
    });
  });

  describe("Gestion des fichiers", function () {
    beforeEach(async function () {
      await safeDocs.connect(user1).registerUser("Alice");
    });

    it("Devrait permettre d'ajouter un fichier", async function () {
      await expect(
        safeDocs.connect(user1).addFile("QmTest123", "test.pdf", 1024)
      ).to.emit(safeDocs, "FileAdded");

      const fileCount = await safeDocs.connect(user1).getMyFileCount();
      expect(fileCount).to.equal(1);
    });

    it("Ne devrait pas permettre à un non-inscrit d'ajouter un fichier", async function () {
      await expect(
        safeDocs.connect(user2).addFile("QmTest123", "test.pdf", 1024)
      ).to.be.revertedWith("User not registered");
    });

    it("Ne devrait pas accepter un hash IPFS vide", async function () {
      await expect(
        safeDocs.connect(user1).addFile("", "test.pdf", 1024)
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Ne devrait pas accepter un nom de fichier vide", async function () {
      await expect(
        safeDocs.connect(user1).addFile("QmTest123", "", 1024)
      ).to.be.revertedWith("File name cannot be empty");
    });

    it("Ne devrait pas accepter une taille de 0", async function () {
      await expect(
        safeDocs.connect(user1).addFile("QmTest123", "test.pdf", 0)
      ).to.be.revertedWith("File size must be greater than 0");
    });

    it("Devrait retourner les fichiers d'un utilisateur", async function () {
      await safeDocs.connect(user1).addFile("QmTest1", "file1.pdf", 1024);
      await safeDocs.connect(user1).addFile("QmTest2", "file2.pdf", 2048);

      const files = await safeDocs.connect(user1).getUserFiles();
      expect(files.length).to.equal(2);
      expect(files[0].fileName).to.equal("file1.pdf");
      expect(files[1].fileName).to.equal("file2.pdf");
    });

    it("Devrait permettre de supprimer un fichier", async function () {
      await safeDocs.connect(user1).addFile("QmTest123", "test.pdf", 1024);
      
      await expect(
        safeDocs.connect(user1).deleteFile(0)
      ).to.emit(safeDocs, "FileDeleted");

      const fileCount = await safeDocs.connect(user1).getMyFileCount();
      expect(fileCount).to.equal(0);
    });

    it("Ne devrait pas permettre de supprimer un fichier inexistant", async function () {
      await expect(
        safeDocs.connect(user1).deleteFile(999)
      ).to.be.revertedWith("File does not exist");
    });

    it("Devrait gérer plusieurs fichiers correctement", async function () {
      await safeDocs.connect(user1).addFile("QmTest1", "file1.pdf", 1024);
      await safeDocs.connect(user1).addFile("QmTest2", "file2.pdf", 2048);
      await safeDocs.connect(user1).addFile("QmTest3", "file3.pdf", 3072);

      let files = await safeDocs.connect(user1).getUserFiles();
      expect(files.length).to.equal(3);

      await safeDocs.connect(user1).deleteFile(1);

      files = await safeDocs.connect(user1).getUserFiles();
      expect(files.length).to.equal(2);
      expect(files[0].fileName).to.equal("file1.pdf");
      expect(files[1].fileName).to.equal("file3.pdf");
    });
  });

  describe("Isolation des utilisateurs", function () {
    beforeEach(async function () {
      await safeDocs.connect(user1).registerUser("Alice");
      await safeDocs.connect(user2).registerUser("Bob");
    });

    it("Les fichiers doivent être isolés par utilisateur", async function () {
      await safeDocs.connect(user1).addFile("QmAlice", "alice.pdf", 1024);
      await safeDocs.connect(user2).addFile("QmBob", "bob.pdf", 2048);

      const aliceFiles = await safeDocs.connect(user1).getUserFiles();
      const bobFiles = await safeDocs.connect(user2).getUserFiles();

      expect(aliceFiles.length).to.equal(1);
      expect(bobFiles.length).to.equal(1);
      expect(aliceFiles[0].fileName).to.equal("alice.pdf");
      expect(bobFiles[0].fileName).to.equal("bob.pdf");
    });
  });

  describe("Compteurs", function () {
    it("Devrait compter correctement le nombre total d'utilisateurs", async function () {
      await safeDocs.connect(user1).registerUser("Alice");
      expect(await safeDocs.getTotalUsers()).to.equal(1);

      await safeDocs.connect(user2).registerUser("Bob");
      expect(await safeDocs.getTotalUsers()).to.equal(2);
    });

    it("Devrait compter correctement les fichiers par utilisateur", async function () {
      await safeDocs.connect(user1).registerUser("Alice");
      
      await safeDocs.connect(user1).addFile("QmTest1", "file1.pdf", 1024);
      expect(await safeDocs.connect(user1).getMyFileCount()).to.equal(1);

      await safeDocs.connect(user1).addFile("QmTest2", "file2.pdf", 2048);
      expect(await safeDocs.connect(user1).getMyFileCount()).to.equal(2);

      await safeDocs.connect(user1).deleteFile(0);
      expect(await safeDocs.connect(user1).getMyFileCount()).to.equal(1);
    });
  });
});

