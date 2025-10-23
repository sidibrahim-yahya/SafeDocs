export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  "function registerUser(string memory _username) external",
  "function addFile(string memory _ipfsHash, string memory _fileName, uint256 _fileSize) external",
  "function deleteFile(uint256 _fileId) external",
  "function getFile(uint256 _fileId) external view returns (string memory ipfsHash, string memory fileName, uint256 fileSize, uint256 timestamp)",
  "function getUserFiles() external view returns (tuple(string ipfsHash, string fileName, uint256 fileSize, uint256 timestamp, bool exists)[] memory)",
  "function getUserInfo(address _userAddress) external view returns (string memory username, uint256 registrationDate, uint256 fileCount, bool isRegistered)",
  "function isUserRegistered(address _userAddress) external view returns (bool)",
  "function getTotalUsers() external view returns (uint256)",
  "function getMyFileCount() external view returns (uint256)",
  "event UserRegistered(address indexed userAddress, string username, uint256 timestamp)",
  "event FileAdded(address indexed userAddress, uint256 indexed fileId, string ipfsHash, string fileName, uint256 timestamp)",
  "event FileDeleted(address indexed userAddress, uint256 indexed fileId, uint256 timestamp)"
];

export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const PINATA_API_URL = "https://api.pinata.cloud";

