-- Create partner_service_addresses table
CREATE TABLE IF NOT EXISTS partner_service_addresses (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES partner_services(id) ON DELETE CASCADE,
  address_id INTEGER NOT NULL REFERENCES partner_addresses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, address_id)
);

-- Create indexes for better performance
CREATE INDEX idx_partner_service_addresses_service_id ON partner_service_addresses(service_id);
CREATE INDEX idx_partner_service_addresses_address_id ON partner_service_addresses(address_id);

-- Add comment to the table
COMMENT ON TABLE partner_service_addresses IS 'Relaciona serviços de parceiros com endereços específicos onde são oferecidos';