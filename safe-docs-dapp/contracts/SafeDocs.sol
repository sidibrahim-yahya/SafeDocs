// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeDocs is Ownable, ReentrancyGuard {
    
    struct FileMetadata {
        string ipfsHash;
        string fileName;
        uint256 fileSize;
        uint256 timestamp;
        bool exists;
    }
    
    struct User {
        address userAddress;
        string username;
        uint256 registrationDate;
        bool isRegistered;
        uint256 fileCount;
    }
    
    mapping(address => User) public users;
    mapping(address => mapping(uint256 => FileMetadata)) public userFiles;
    mapping(address => uint256) public userFileCount;
    
    address[] public registeredUsers;
    
    event UserRegistered(address indexed userAddress, string username, uint256 timestamp);
    event FileAdded(address indexed userAddress, uint256 indexed fileId, string ipfsHash, string fileName, uint256 timestamp);
    event FileDeleted(address indexed userAddress, uint256 indexed fileId, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {}
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    function registerUser(string memory _username) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= 50, "Username too long");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            registrationDate: block.timestamp,
            isRegistered: true,
            fileCount: 0
        });
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }
    
    function addFile(
        string memory _ipfsHash,
        string memory _fileName,
        uint256 _fileSize
    ) external onlyRegistered nonReentrant {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(_fileSize > 0, "File size must be greater than 0");
        
        uint256 fileId = userFileCount[msg.sender];
        
        userFiles[msg.sender][fileId] = FileMetadata({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            exists: true
        });
        
        userFileCount[msg.sender]++;
        users[msg.sender].fileCount++;
        
        emit FileAdded(msg.sender, fileId, _ipfsHash, _fileName, block.timestamp);
    }
    
    function deleteFile(uint256 _fileId) external onlyRegistered nonReentrant {
        require(userFiles[msg.sender][_fileId].exists, "File does not exist");
        
        delete userFiles[msg.sender][_fileId];
        users[msg.sender].fileCount--;
        
        emit FileDeleted(msg.sender, _fileId, block.timestamp);
    }
    
    function getFile(uint256 _fileId) external view onlyRegistered returns (
        string memory ipfsHash,
        string memory fileName,
        uint256 fileSize,
        uint256 timestamp
    ) {
        FileMetadata memory file = userFiles[msg.sender][_fileId];
        require(file.exists, "File does not exist");
        
        return (
            file.ipfsHash,
            file.fileName,
            file.fileSize,
            file.timestamp
        );
    }
    
    function getUserFiles() external view onlyRegistered returns (FileMetadata[] memory) {
        uint256 count = userFileCount[msg.sender];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < count; i++) {
            if (userFiles[msg.sender][i].exists) {
                activeCount++;
            }
        }
        
        FileMetadata[] memory files = new FileMetadata[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < count; i++) {
            if (userFiles[msg.sender][i].exists) {
                files[index] = userFiles[msg.sender][i];
                index++;
            }
        }
        
        return files;
    }
    
    function getUserInfo(address _userAddress) external view returns (
        string memory username,
        uint256 registrationDate,
        uint256 fileCount,
        bool isRegistered
    ) {
        User memory user = users[_userAddress];
        return (
            user.username,
            user.registrationDate,
            user.fileCount,
            user.isRegistered
        );
    }
    
    function isUserRegistered(address _userAddress) external view returns (bool) {
        return users[_userAddress].isRegistered;
    }
    
    function getTotalUsers() external view returns (uint256) {
        return registeredUsers.length;
    }
    
    function getMyFileCount() external view onlyRegistered returns (uint256) {
        return users[msg.sender].fileCount;
    }
}

