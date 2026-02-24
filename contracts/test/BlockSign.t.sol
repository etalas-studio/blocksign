// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BlockSign} from "../src/BlockSign.sol";

/**
 * @title BlockSignTest
 * @notice Comprehensive test suite for BlockSign smart contract
 * @dev Covers unit, security, integration, and fuzzing tests
 */
contract BlockSignTest is Test {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error EmptySignature();
    error ZeroDocumentHash();
    error AlreadySigned(address signer, bytes32 docHash);

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event DocumentSigned(address indexed signer, bytes32 indexed docHash, uint256 timestamp, bytes signature);
    event ContractPaused(bool paused);

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    address internal constant OWNER = address(0x1);
    address internal constant SIGNER_ONE = address(0x2);
    address internal constant SIGNER_TWO = address(0x3);
    address internal constant SIGNER_THREE = address(0x4);
    address internal constant NON_OWNER = address(0x5);

    bytes32 internal constant DOC_HASH_ONE = keccak256("document one");
    bytes32 internal constant DOC_HASH_TWO = keccak256("document two");
    bytes32 internal constant ZERO_HASH = bytes32(0);

    /*//////////////////////////////////////////////////////////////
                              TEST CONTRACT
    //////////////////////////////////////////////////////////////*/

    BlockSign public blockSign;

    /*//////////////////////////////////////////////////////////////
                              SETUP
    //////////////////////////////////////////////////////////////*/

    function setUp() public {
        vm.prank(OWNER);
        blockSign = new BlockSign(OWNER);
    }

    /*//////////////////////////////////////////////////////////////
                         HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Create a mock signature for testing
     * @return A mock signature bytes array
     */
    function createMockSignature() internal pure returns (bytes memory) {
        return abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)), uint8(27));
    }

    /**
     * @dev Create a signature with specific length
     * @param length Desired signature length
     * @return A mock signature with specified length
     */
    function createSignatureOfLength(uint256 length) internal pure returns (bytes memory) {
        bytes memory signature = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            signature[i] = bytes1(uint8(i % 256));
        }
        return signature;
    }

    /**
     * @dev Deploy a fresh BlockSign contract instance
     * @return New BlockSign contract
     */
    function deployFreshContract() internal returns (BlockSign) {
        vm.prank(OWNER);
        return new BlockSign(OWNER);
    }

    /**
     * @dev Sign a document as a specific signer
     * @param signer Address to sign as
     * @param docHash Document hash to sign
     * @return sigIndex Index of the stored signature
     */
    function signAs(address signer, bytes32 docHash) internal returns (uint256 sigIndex) {
        vm.prank(signer);
        return blockSign.signDocument(docHash, createMockSignature());
    }

    /**
     * @dev Expect a specific custom error
     * @param err The custom error to expect
     */
    function expectCustomError(bytes4 err) internal {
        vm.expectRevert(err);
    }

    /*//////////////////////////////////////////////////////////////
                    UNIT TESTS: signDocument()
    //////////////////////////////////////////////////////////////*/

    function test_SignDocument_ValidSignature() public {
        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(DOC_HASH_ONE, createMockSignature());

        // Verify signature was stored
        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs[sigIndex].signer, SIGNER_ONE, "Signer should match");
        assertEq(sigs[sigIndex].signature, createMockSignature(), "Signature should match");
        assertTrue(blockSign.hasSigned(DOC_HASH_ONE, SIGNER_ONE), "Should be marked as signed");
        assertEq(blockSign.totalSignatures(), 1, "Total signatures should be 1");
    }

    function test_SignDocument_EmptySignature() public {
        vm.prank(SIGNER_ONE);
        vm.expectRevert(BlockSign.EmptySignature.selector);
        blockSign.signDocument(DOC_HASH_ONE, "");
    }

    function test_SignDocument_ZeroDocumentHash() public {
        vm.prank(SIGNER_ONE);
        vm.expectRevert(BlockSign.ZeroDocumentHash.selector);
        blockSign.signDocument(ZERO_HASH, createMockSignature());
    }

    function test_SignDocument_SameDocumentTwice() public {
        // First signature
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        // Attempt second signature by same signer
        vm.prank(SIGNER_ONE);
        vm.expectRevert(abi.encodeWithSelector(BlockSign.AlreadySigned.selector, SIGNER_ONE, DOC_HASH_ONE));
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());
    }

    function test_SignDocument_PausedContract() public {
        // Pause the contract
        vm.prank(OWNER);
        blockSign.pause();

        // Attempt to sign while paused
        vm.prank(SIGNER_ONE);
        vm.expectRevert("Contract is paused");
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());
    }

    function test_SignDocument_EmitsDocumentSignedEvent() public {
        vm.prank(SIGNER_ONE);
        bytes memory signature = createMockSignature();

        vm.expectEmit(true, true, false, true);
        emit DocumentSigned(SIGNER_ONE, DOC_HASH_ONE, block.timestamp, signature);

        blockSign.signDocument(DOC_HASH_ONE, signature);
    }

    /*//////////////////////////////////////////////////////////////
                      UNIT TESTS: verify()
    //////////////////////////////////////////////////////////////*/

    function test_Verify_ExistingSignature() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        bool exists = blockSign.verify(DOC_HASH_ONE, SIGNER_ONE);
        assertTrue(exists, "Should verify existing signature");
    }

    function test_Verify_NonExistingSignature() public {
        bool exists = blockSign.verify(DOC_HASH_ONE, SIGNER_ONE);
        assertFalse(exists, "Should return false for non-existent signature");
    }

    function test_Verify_WrongSigner() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        bool exists = blockSign.verify(DOC_HASH_ONE, SIGNER_TWO);
        assertFalse(exists, "Should return false for wrong signer");
    }

    function test_Verify_WrongDocument() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        bool exists = blockSign.verify(DOC_HASH_TWO, SIGNER_ONE);
        assertFalse(exists, "Should return false for wrong document");
    }

    /*//////////////////////////////////////////////////////////////
                    UNIT TESTS: getSignatures()
    //////////////////////////////////////////////////////////////*/

    function test_GetSignatures_NoSignatures() public {
        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, 0, "Should return empty array");
    }

    function test_GetSignatures_SingleSignature() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, 1, "Should have one signature");
        assertEq(sigs[0].signer, SIGNER_ONE, "Signer should match");
        assertEq(sigs[0].docHash, DOC_HASH_ONE, "DocHash should match");
    }

    function test_GetSignatures_MultipleSignatures() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);
        signAs(SIGNER_TWO, DOC_HASH_ONE);
        signAs(SIGNER_THREE, DOC_HASH_ONE);

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, 3, "Should have three signatures");

        assertEq(sigs[0].signer, SIGNER_ONE, "First signer should match");
        assertEq(sigs[1].signer, SIGNER_TWO, "Second signer should match");
        assertEq(sigs[2].signer, SIGNER_THREE, "Third signer should match");
    }

    /*//////////////////////////////////////////////////////////////
                  UNIT TESTS: getSignatureCount()
    //////////////////////////////////////////////////////////////*/

    function test_GetSignatureCount_EmptyDocument() public {
        uint256 count = blockSign.getSignatureCount(DOC_HASH_ONE);
        assertEq(count, 0, "Count should be 0 for unsigned document");
    }

    function test_GetSignatureCount_SingleSignature() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        uint256 count = blockSign.getSignatureCount(DOC_HASH_ONE);
        assertEq(count, 1, "Count should be 1");
    }

    function test_GetSignatureCount_MultipleSignatures() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);
        signAs(SIGNER_TWO, DOC_HASH_ONE);
        signAs(SIGNER_THREE, DOC_HASH_ONE);

        uint256 count = blockSign.getSignatureCount(DOC_HASH_ONE);
        assertEq(count, 3, "Count should be 3");
    }

    /*//////////////////////////////////////////////////////////////
                      SECURITY TESTS: Replay Protection
    //////////////////////////////////////////////////////////////*/

    function test_ReplayProtection_DoubleSigning() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        vm.prank(SIGNER_ONE);
        vm.expectRevert(abi.encodeWithSelector(BlockSign.AlreadySigned.selector, SIGNER_ONE, DOC_HASH_ONE));
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());
    }

    function test_ReplayProtection_DifferentDocuments() public {
        // Same signer can sign different documents
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(DOC_HASH_TWO, createMockSignature());

        assertTrue(blockSign.hasSigned(DOC_HASH_TWO, SIGNER_ONE), "Second doc should be signed");
        assertEq(blockSign.totalSignatures(), 2, "Total should be 2");
    }

    function test_ReplayProtection_AfterPause() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        // Pause and unpause
        vm.prank(OWNER);
        blockSign.pause();
        vm.prank(OWNER);
        blockSign.unpause();

        // Replay protection should still be active
        vm.prank(SIGNER_ONE);
        vm.expectRevert(abi.encodeWithSelector(BlockSign.AlreadySigned.selector, SIGNER_ONE, DOC_HASH_ONE));
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());
    }

    /*//////////////////////////////////////////////////////////////
                    SECURITY TESTS: Access Control
    //////////////////////////////////////////////////////////////*/

    function test_AccessControl_PauseByOwner() public {
        vm.prank(OWNER);
        blockSign.pause();

        assertTrue(blockSign.isPaused(), "Contract should be paused");
    }

    function test_AccessControl_PauseByNonOwner() public {
        vm.expectRevert();
        vm.prank(NON_OWNER);
        blockSign.pause();
    }

    function test_AccessControl_UnpauseByOwner() public {
        vm.prank(OWNER);
        blockSign.pause();

        vm.prank(OWNER);
        blockSign.unpause();

        assertFalse(blockSign.isPaused(), "Contract should be unpaused");
    }

    function test_AccessControl_UnpauseByNonOwner() public {
        vm.prank(OWNER);
        blockSign.pause();

        vm.expectRevert();
        vm.prank(NON_OWNER);
        blockSign.unpause();
    }

    function test_AccessControl_PauseEmitsEvent() public {
        vm.prank(OWNER);
        vm.expectEmit(false, false, false, true);
        emit ContractPaused(true);
        blockSign.pause();
    }

    function test_AccessControl_UnpauseEmitsEvent() public {
        vm.prank(OWNER);
        blockSign.pause();

        vm.prank(OWNER);
        vm.expectEmit(false, false, false, true);
        emit ContractPaused(false);
        blockSign.unpause();
    }

    /*//////////////////////////////////////////////////////////////
                  SECURITY TESTS: Input Validation
    //////////////////////////////////////////////////////////////*/

    function test_InputValidation_ZeroHash() public {
        vm.prank(SIGNER_ONE);
        vm.expectRevert(BlockSign.ZeroDocumentHash.selector);
        blockSign.signDocument(ZERO_HASH, createMockSignature());
    }

    function test_InputValidation_EmptySignature() public {
        vm.prank(SIGNER_ONE);
        vm.expectRevert(BlockSign.EmptySignature.selector);
        blockSign.signDocument(DOC_HASH_ONE, "");
    }

    function test_InputValidation_LargeSignature() public {
        bytes memory largeSig = createSignatureOfLength(96);

        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(DOC_HASH_ONE, largeSig);

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs[sigIndex].signature.length, 96, "Should store large signature");
    }

    /*//////////////////////////////////////////////////////////////
                   INTEGRATION TESTS: Complete Flows
    //////////////////////////////////////////////////////////////*/

    function test_Integration_CompleteSigningFlow() public {
        // Step 1: Sign document
        uint256 sigIndex = signAs(SIGNER_ONE, DOC_HASH_ONE);

        // Step 2: Verify signature exists
        bool exists = blockSign.verify(DOC_HASH_ONE, SIGNER_ONE);
        assertTrue(exists, "Signature should exist");

        // Step 3: Retrieve signature
        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, 1, "Should have one signature");
        assertEq(sigs[0].signer, SIGNER_ONE, "Signer should match");

        // Step 4: Check count
        uint256 count = blockSign.getSignatureCount(DOC_HASH_ONE);
        assertEq(count, 1, "Count should be 1");

        // Step 5: Query by different signer (should not exist)
        bool otherExists = blockSign.verify(DOC_HASH_ONE, SIGNER_TWO);
        assertFalse(otherExists, "Other signer should not have signed");
    }

    function test_Integration_MultiSignerDocument() public {
        // User A signs
        signAs(SIGNER_ONE, DOC_HASH_ONE);
        assertTrue(blockSign.verify(DOC_HASH_ONE, SIGNER_ONE), "User A should have signed");

        // User B signs
        signAs(SIGNER_TWO, DOC_HASH_ONE);
        assertTrue(blockSign.verify(DOC_HASH_ONE, SIGNER_TWO), "User B should have signed");

        // User C signs
        signAs(SIGNER_THREE, DOC_HASH_ONE);
        assertTrue(blockSign.verify(DOC_HASH_ONE, SIGNER_THREE), "User C should have signed");

        // Verify all three exist
        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, 3, "Should have 3 signatures");
        assertEq(blockSign.totalSignatures(), 3, "Total signatures should be 3");

        // Verify order
        assertEq(sigs[0].signer, SIGNER_ONE, "First should be SIGNER_ONE");
        assertEq(sigs[1].signer, SIGNER_TWO, "Second should be SIGNER_TWO");
        assertEq(sigs[2].signer, SIGNER_THREE, "Third should be SIGNER_THREE");
    }

    function test_Integration_EmergencyPause() public {
        // Sign document
        signAs(SIGNER_ONE, DOC_HASH_ONE);

        // Owner pauses contract
        vm.prank(OWNER);
        blockSign.pause();

        // Attempt to sign fails
        vm.prank(SIGNER_TWO);
        vm.expectRevert("Contract is paused");
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());

        // Owner unpauses
        vm.prank(OWNER);
        blockSign.unpause();

        // Signing succeeds again
        signAs(SIGNER_TWO, DOC_HASH_ONE);
        assertTrue(blockSign.verify(DOC_HASH_ONE, SIGNER_TWO), "Should succeed after unpause");
    }

    /*//////////////////////////////////////////////////////////////
                         FUZZING TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_SignDocument_ArbitraryHash(bytes32 docHash) public {
        vm.assume(docHash != ZERO_HASH);

        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(docHash, createMockSignature());

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(docHash);
        assertEq(sigs[sigIndex].signer, SIGNER_ONE, "Signer should match");
        assertTrue(blockSign.verify(docHash, SIGNER_ONE), "Should verify");
    }

    function testFuzz_SignDocument_ArbitrarySignature(bytes calldata signature) public {
        vm.assume(signature.length > 0);

        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(DOC_HASH_ONE, signature);

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs[sigIndex].signature, signature, "Signature should match");
    }

    function testFuzz_MultipleDocumentsMultipleSigners(bytes32 docHash1, bytes32 docHash2, address signer) public {
        vm.assume(docHash1 != ZERO_HASH);
        vm.assume(docHash2 != ZERO_HASH);
        vm.assume(docHash1 != docHash2);
        vm.assume(signer != address(0));

        // Same signer can sign multiple different documents
        vm.prank(signer);
        blockSign.signDocument(docHash1, createMockSignature());

        vm.prank(signer);
        blockSign.signDocument(docHash2, createMockSignature());

        assertEq(blockSign.totalSignatures(), 2, "Should have 2 signatures");
        assertTrue(blockSign.verify(docHash1, signer), "First doc should be signed");
        assertTrue(blockSign.verify(docHash2, signer), "Second doc should be signed");
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_EdgeCase_FirstSignature() public {
        assertEq(blockSign.totalSignatures(), 0, "Should start at 0");

        vm.prank(SIGNER_ONE);
        blockSign.signDocument(DOC_HASH_ONE, createMockSignature());

        assertEq(blockSign.totalSignatures(), 1, "Should increment to 1");
    }

    function test_EdgeCase_MultipleDocumentsSameSigner() public {
        bytes32[] memory docHashes = new bytes32[](5);
        for (uint256 i = 0; i < 5; i++) {
            docHashes[i] = keccak256(abi.encodePacked("document", i));
        }

        for (uint256 i = 0; i < 5; i++) {
            vm.prank(SIGNER_ONE);
            blockSign.signDocument(docHashes[i], createMockSignature());
        }

        assertEq(blockSign.totalSignatures(), 5, "Should have 5 signatures");

        // Verify all documents are signed by SIGNER_ONE
        for (uint256 i = 0; i < 5; i++) {
            assertTrue(blockSign.verify(docHashes[i], SIGNER_ONE), "Each doc should be signed");
        }
    }

    function test_EdgeCase_ConcurrentSignatures() public {
        // Sign multiple documents in sequence without state interference
        bytes32 doc1 = keccak256("doc1");
        bytes32 doc2 = keccak256("doc2");
        bytes32 doc3 = keccak256("doc3");

        signAs(SIGNER_ONE, doc1);
        signAs(SIGNER_TWO, doc2);
        signAs(SIGNER_THREE, doc3);

        assertEq(blockSign.totalSignatures(), 3, "Should have 3 total");
        assertTrue(blockSign.verify(doc1, SIGNER_ONE), "Doc1 signed by SIGNER_ONE");
        assertTrue(blockSign.verify(doc2, SIGNER_TWO), "Doc2 signed by SIGNER_TWO");
        assertTrue(blockSign.verify(doc3, SIGNER_THREE), "Doc3 signed by SIGNER_THREE");
    }

    function test_EdgeCase_MaxSignatureArraySize() public {
        // Test with a large number of signatures
        uint256 numSigners = 20;

        for (uint256 i = 0; i < numSigners; i++) {
            address signer = address(uint160(0x100 + i));
            vm.prank(signer);
            blockSign.signDocument(DOC_HASH_ONE, createMockSignature());
        }

        uint256 count = blockSign.getSignatureCount(DOC_HASH_ONE);
        assertEq(count, numSigners, "Should have all signatures");

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        assertEq(sigs.length, numSigners, "Array should contain all signatures");
    }

    /*//////////////////////////////////////////////////////////////
                      STATE VARIABLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_State_TotalSignatures_Increments() public {
        assertEq(blockSign.totalSignatures(), 0, "Initial count should be 0");

        signAs(SIGNER_ONE, DOC_HASH_ONE);
        assertEq(blockSign.totalSignatures(), 1, "Should be 1 after first");

        signAs(SIGNER_TWO, DOC_HASH_ONE);
        assertEq(blockSign.totalSignatures(), 2, "Should be 2 after second");

        signAs(SIGNER_ONE, DOC_HASH_TWO);
        assertEq(blockSign.totalSignatures(), 3, "Should be 3 after third");
    }

    function test_State_HasSigned_Mapping() public {
        assertFalse(blockSign.hasSigned(DOC_HASH_ONE, SIGNER_ONE), "Should start as false");

        signAs(SIGNER_ONE, DOC_HASH_ONE);
        assertTrue(blockSign.hasSigned(DOC_HASH_ONE, SIGNER_ONE), "Should be true after signing");

        // Different combination should still be false
        assertFalse(blockSign.hasSigned(DOC_HASH_TWO, SIGNER_ONE), "Different doc should be false");
        assertFalse(blockSign.hasSigned(DOC_HASH_ONE, SIGNER_TWO), "Different signer should be false");
    }

    function test_State_Paused_Toggle() public {
        assertFalse(blockSign.isPaused(), "Should start unpaused");

        vm.prank(OWNER);
        blockSign.pause();
        assertTrue(blockSign.isPaused(), "Should be paused");

        vm.prank(OWNER);
        blockSign.unpause();
        assertFalse(blockSign.isPaused(), "Should be unpaused again");
    }

    /*//////////////////////////////////////////////////////////////
                          DATA integrity TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DataIntegrity_SignatureFields() public {
        bytes memory sig = createMockSignature();
        uint256 expectedTimestamp = block.timestamp;

        vm.prank(SIGNER_ONE);
        uint256 sigIndex = blockSign.signDocument(DOC_HASH_ONE, sig);

        BlockSign.Signature[] memory sigs = blockSign.getSignatures(DOC_HASH_ONE);
        BlockSign.Signature memory storedSig = sigs[sigIndex];

        assertEq(storedSig.signer, SIGNER_ONE, "Signer field should match");
        assertEq(storedSig.docHash, DOC_HASH_ONE, "DocHash field should match");
        assertEq(storedSig.timestamp, expectedTimestamp, "Timestamp should match block.timestamp");
        assertEq(storedSig.signature, sig, "Signature field should match");
    }

    function test_DataIntegrity_MultipleDocumentsSeparateArrays() public {
        signAs(SIGNER_ONE, DOC_HASH_ONE);
        signAs(SIGNER_TWO, DOC_HASH_TWO);

        BlockSign.Signature[] memory sigs1 = blockSign.getSignatures(DOC_HASH_ONE);
        BlockSign.Signature[] memory sigs2 = blockSign.getSignatures(DOC_HASH_TWO);

        assertEq(sigs1.length, 1, "Doc1 should have 1 signature");
        assertEq(sigs2.length, 1, "Doc2 should have 1 signature");

        assertEq(sigs1[0].signer, SIGNER_ONE, "Doc1 signed by SIGNER_ONE");
        assertEq(sigs2[0].signer, SIGNER_TWO, "Doc2 signed by SIGNER_TWO");
    }
}
