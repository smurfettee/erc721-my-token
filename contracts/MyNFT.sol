// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter = 1;
    uint256 public constant MINT_FEE = 0.01 ether;
    string private _baseTokenURI;
    
    // Track minted addresses to enforce 1 NFT per wallet
    mapping(address => bool) public hasMinted;
    
    // Events
    event Minted(address indexed to, uint256 indexed tokenId);
    event Withdrawal(address indexed owner, uint256 amount);
    
    constructor(string memory baseURI) ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }
    
    function mint() external payable {
        require(msg.value >= MINT_FEE, "Insufficient ETH sent");
        require(!hasMinted[msg.sender], "Address has already minted");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        hasMinted[msg.sender] = true;
        _safeMint(msg.sender, tokenId);
        
        emit Minted(msg.sender, tokenId);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner(), balance);
    }
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
}