-- Excel verilerini saklamak için yeni tablo
CREATE TABLE IF NOT EXISTS reconciliation_excel_data (
    id SERIAL PRIMARY KEY,
    reconciliation_id INTEGER REFERENCES reconciliations(id) ON DELETE CASCADE,
    sira_no INTEGER,
    cari_hesap_kodu VARCHAR(255),
    cari_hesap_adi VARCHAR(500),
    sube VARCHAR(255),
    cari_hesap_turu VARCHAR(255),
    tutar DECIMAL(15,2),
    birim VARCHAR(10),
    borc_alacak VARCHAR(50),
    vergi_dairesi VARCHAR(255),
    vergi_no VARCHAR(50),
    fax_numarasi VARCHAR(50),
    ilgili_kisi_eposta VARCHAR(255),
    hata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_reconciliation_excel_data_reconciliation_id ON reconciliation_excel_data(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_excel_data_cari_hesap_kodu ON reconciliation_excel_data(cari_hesap_kodu);