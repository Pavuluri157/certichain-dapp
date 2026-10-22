// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertiChain
 * @notice Issues, verifies, and revokes academic certificates on Ethereum.
 * @dev Only the contract owner (the institution) can issue or revoke records.
 */
contract CertiChain {
    address public owner;
    uint256 public certificateCount;

    struct Certificate {
        string studentName;
        string courseName;
        uint256 issuedAt;
        address issuer;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;

    event CertificateIssued(
        bytes32 indexed certificateId,
        string studentName,
        string courseName,
        address indexed issuer,
        uint256 issuedAt
    );
    event CertificateRevoked(bytes32 indexed certificateId, address indexed revokedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the institution owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        bytes32 certificateId,
        string calldata studentName,
        string calldata courseName
    ) external onlyOwner {
        require(certificateId != bytes32(0), "Certificate ID cannot be empty");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        require(!certificates[certificateId].exists, "Certificate already exists");

        certificates[certificateId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            issuedAt: block.timestamp,
            issuer: msg.sender,
            revoked: false,
            exists: true
        });
        certificateCount += 1;

        emit CertificateIssued(
            certificateId,
            studentName,
            courseName,
            msg.sender,
            block.timestamp
        );
    }

    function revokeCertificate(bytes32 certificateId) external onlyOwner {
        require(certificates[certificateId].exists, "Certificate does not exist");
        require(!certificates[certificateId].revoked, "Certificate is already revoked");

        certificates[certificateId].revoked = true;
        emit CertificateRevoked(certificateId, msg.sender);
    }

    function getCertificate(bytes32 certificateId)
        external
        view
        returns (
            string memory studentName,
            string memory courseName,
            uint256 issuedAt,
            address issuer,
            bool revoked,
            bool exists
        )
    {
        Certificate memory certificate = certificates[certificateId];
        return (
            certificate.studentName,
            certificate.courseName,
            certificate.issuedAt,
            certificate.issuer,
            certificate.revoked,
            certificate.exists
        );
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
