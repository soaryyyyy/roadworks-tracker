create database roadworks_tracker;
\c roadworks_tracker;

CREATE TABLE role (
  id BIGSERIAL PRIMARY KEY,
  libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE status_account (
  id BIGSERIAL PRIMARY KEY,
  libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE status_road (
  id BIGSERIAL PRIMARY KEY,
  libelle VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE config (
  id BIGSERIAL PRIMARY KEY,
  max_attempts INT NOT NULL,
  session_duration INT NOT NULL
);

CREATE TABLE account (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  pwd VARCHAR(255) NOT NULL,
  id_role BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INT NOT NULL DEFAULT 0,
  last_failed_login TIMESTAMP,
  CONSTRAINT fk_account_role
    FOREIGN KEY (id_role) REFERENCES role(id)
);

CREATE TABLE account_status (
  id BIGSERIAL PRIMARY KEY,
  id_account BIGINT NOT NULL,
  id_status_account BIGINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_account_status_account
    FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE,
  CONSTRAINT fk_account_status_status
    FOREIGN KEY (id_status_account) REFERENCES status_account(id)
);

CREATE TABLE society_btp (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  siret VARCHAR(30) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE signalement (
  id BIGSERIAL PRIMARY KEY,
  id_account BIGINT NOT NULL,
  descriptions TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  location VARCHAR(255) NOT NULL,
  picture TEXT,
  surface NUMERIC(12,2),
  CONSTRAINT fk_signalement_account
    FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE
);

CREATE TABLE signalement_work (
  id BIGSERIAL PRIMARY KEY,
  id_signalement BIGINT NOT NULL,
  id_society_btp BIGINT NOT NULL,
  start_date DATE,
  end_date_estimation DATE,
  price NUMERIC(14,2),
  real_end_date DATE,
  CONSTRAINT fk_work_signalement
    FOREIGN KEY (id_signalement) REFERENCES signalement(id) ON DELETE CASCADE,
  CONSTRAINT fk_work_society
    FOREIGN KEY (id_society_btp) REFERENCES society_btp(id)
);

CREATE TABLE signalement_status (
  id BIGSERIAL PRIMARY KEY,
  id_signalement BIGINT NOT NULL,
  id_status_road BIGINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sig_status_signalement
    FOREIGN KEY (id_signalement) REFERENCES signalement(id) ON DELETE CASCADE,
  CONSTRAINT fk_sig_status_status
    FOREIGN KEY (id_status_road) REFERENCES status_road(id)
);

CREATE TABLE session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_account BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  CONSTRAINT fk_session_account
    FOREIGN KEY (id_account) REFERENCES account(id) ON DELETE CASCADE
);
