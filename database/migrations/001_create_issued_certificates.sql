CREATE TABLE issued_certificates (
    certificate_id INT NOT NULL AUTO_INCREMENT,
    application_id INT NOT NULL,
    certificate_number VARCHAR(45) NOT NULL,
    issued_by INT NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_note VARCHAR(500) NOT NULL,
    PRIMARY KEY (certificate_id),
    UNIQUE KEY uq_issued_certificates_application (application_id),
    UNIQUE KEY uq_issued_certificates_number (certificate_number),
    KEY ix_issued_certificates_issuer (issued_by),
    CONSTRAINT fk_issued_certificates_application
        FOREIGN KEY (application_id) REFERENCES applications (application_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_issued_certificates_issuer
        FOREIGN KEY (issued_by) REFERENCES users (user_id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;