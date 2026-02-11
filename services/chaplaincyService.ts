
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants';
import { Unit } from '../types';

// --- CONFIGURAÇÃO UNIFICADA HAP ---
// Fix: Updated comment from HAM to HAP
// Agora utiliza a mesma conexão do banco principal para evitar silos de dados externos.
export const chaplaincyClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface InvitePayload {
  pg_name: string;
  leader_name: string;
  leader_phone?: string;
  // Fix: Changed Unit.HAM to Unit.HAP and updated comment
  unit: Unit.HAP; // Restrito exclusivamente para HAP (Pênfigo)
  date: string; // ISO String com fuso horário
  request_notes?: string;
  preferred_chaplain_id?: string;
}

export const sendChaplainInvite = async (data: InvitePayload) => {
  try {
    // Fix: Updated log message from HAM to HAP
    console.log("[Bridge] Enviando solicitação para Capelania HAP:", data);
    
    const { error } = await chaplaincyClient
      .from('visit_requests')
      .insert({
        pg_name: data.pg_name,
        leader_name: data.leader_name,
        leader_phone: data.leader_phone,
        // Fix: Changed value to Unit.HAP
        unit: Unit.HAP,
        date: data.date,
        request_notes: data.request_notes,
        preferred_chaplain_id: data.preferred_chaplain_id || null,
        status: 'pending'
      });

    if (error) {
      console.error("[Bridge] Erro Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Bridge] Erro de conexão interna:", e);
    return false;
  }
};