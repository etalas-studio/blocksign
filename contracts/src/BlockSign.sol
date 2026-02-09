// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockSign
 * @notice Blockchain-based document signature registry
 * @dev Stores cryptographic proofs of document signatures on-chain
 * @custom:security-contact security@blocksign.dev
 */
contract BlockSign is ReentrancyGuard, Ownable {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @dev Thrown when signature is empty
    error EmptySignature();

    /// @dev Thrown when document hash is zero
    error ZeroDocumentHash();

    /// @dev Thrown when the same signer has already signed this document
    error AlreadySigned(address signer, bytes32 docHash);

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Signature record stored on-chain
     * @param signer Address of the wallet that signed the document
     * @param docHash SHA-256 hash of the document content
     * @param timestamp Block timestamp when signature was recorded
     * @param signature ECDSA signature bytes
     */
    struct Signature {
        address signer;
        bytes32 docHash;
        uint256 timestamp;
        bytes signature;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mapping from document hash to array of signatures
     * @notice A document can have multiple signers
     */
    mapping(bytes32 docHash => Signature[]) public signatures;

    /**
     * @dev Mapping to track unique signer+document combinations (replay protection)
     */
    mapping(bytes32 docHash => mapping(address signer => bool)) public hasSigned;

    /**
     * @dev Counter for total number of signatures recorded
     */
    uint256 public totalSignatures;

    /**
     * @dev Contract paused status for emergency situations
     */
    bool public paused;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Emitted when a document is signed
     * @param signer Address of the signer
     * @param docHash Hash of the signed document
     * @param timestamp Block timestamp of signature
     * @param signature The signature bytes
     */
    event DocumentSigned(
        address indexed signer,
        bytes32 indexed docHash,
        uint256 timestamp,
        bytes signature
    );

    /**
     * @dev Emitted when contract is paused/unpaused
     * @param paused New paused state
     */
    event ContractPaused(bool paused);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Initialize contract with deployer as owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /*//////////////////////////////////////////////////////////////
                          CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Record a document signature on the blockchain
     * @dev Stores signature with replay protection
     * @param docHash SHA-256 hash of the document
     * @param signature ECDSA signature from the signer
     * @return sigIndex Index of the stored signature
     */
    function signDocument(bytes32 docHash, bytes calldata signature)
        external
        nonReentrant
        returns (uint256 sigIndex)
    {
        // Prevent signing when paused
        if (paused) revert("Contract is paused");

        // Validate inputs
        if (docHash == bytes32(0)) revert ZeroDocumentHash();
        if (signature.length == 0) revert EmptySignature();

        // Check for replay attack - same signer cannot sign same document twice
        if (hasSigned[docHash][msg.sender]) {
            revert AlreadySigned(msg.sender, docHash);
        }

        // Record the signature
        signatures[docHash].push(Signature({
            signer: msg.sender,
            docHash: docHash,
            timestamp: block.timestamp,
            signature: signature
        }));

        sigIndex = signatures[docHash].length - 1;

        // Mark as signed (replay protection)
        hasSigned[docHash][msg.sender] = true;

        // Increment total counter
        totalSignatures++;

        // Emit event for indexing
        emit DocumentSigned(msg.sender, docHash, block.timestamp, signature);
    }

    /**
     * @notice Verify if a signer has signed a specific document
     * @dev Check if signature exists for given document hash and signer
     * @param docHash SHA-256 hash of the document
     * @param signer Address to check
     * @return exists True if the signer has signed this document
     */
    function verify(bytes32 docHash, address signer)
        external
        view
        returns (bool exists)
    {
        return hasSigned[docHash][signer];
    }

    /**
     * @notice Get all signatures for a document
     * @dev Returns array of all signature records for the document
     * @param docHash SHA-256 hash of the document
     * @return sigs Array of Signature structs
     */
    function getSignatures(bytes32 docHash)
        external
        view
        returns (Signature[] memory sigs)
    {
        return signatures[docHash];
    }

    /**
     * @notice Get signature count for a document
     * @param docHash SHA-256 hash of the document
     * @return count Number of signatures for this document
     */
    function getSignatureCount(bytes32 docHash)
        external
        view
        returns (uint256 count)
    {
        return signatures[docHash].length;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emergency pause - prevent new signatures
     * @dev Only callable by owner
     */
    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused(true);
    }

    /**
     * @notice Unpause - resume accepting signatures
     * @dev Only callable by owner
     */
    function unpause() external onlyOwner {
        paused = false;
        emit ContractPaused(false);
    }

    /**
     * @notice Get current pause status
     * @return status True if contract is paused
     */
    function isPaused() external view returns (bool status) {
        return paused;
    }
}
