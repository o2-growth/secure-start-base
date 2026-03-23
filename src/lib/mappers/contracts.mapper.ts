export interface LovableContractResponse {
  id?: string;
  external_contract_id?: string;
  url?: string;
  status?: string;
}

export interface ContractPayload {
  contract_id: string;
  card_id: string;
  lead: {
    full_name?: string;
    email?: string;
    phone?: string;
    document?: string;
    company_name?: string;
  };
  pipeline: string;
  business_unit: string;
  created_by: string;
  created_at: string;
}

export function mapLovableResponse(response: LovableContractResponse) {
  return {
    externalContractId: response.external_contract_id ?? response.id ?? null,
    url: response.url ?? null,
    status: response.status ?? "pending_signature",
  };
}
