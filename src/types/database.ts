export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      andamentos: {
        Row: {
          etapa_id: string
          id: string
          iniciada_em: string | null
          nota: string | null
          processo_id: string
          resolvida_em: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_da_etapa"]
        }
        Insert: {
          etapa_id: string
          id?: string
          iniciada_em?: string | null
          nota?: string | null
          processo_id: string
          resolvida_em?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_da_etapa"]
        }
        Update: {
          etapa_id?: string
          id?: string
          iniciada_em?: string | null
          nota?: string | null
          processo_id?: string
          resolvida_em?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_da_etapa"]
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "andamentos_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["etapa_atual_id"]
          },
          {
            foreignKeyName: "andamentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "andamentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "andamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos_da_versao: {
        Row: {
          copiado_de: string | null
          drive_id: string
          enviado_em: string
          enviado_por: string
          formato: string
          hash_md5: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_do_arquivo"]
          tamanho: number
          versao_id: string
        }
        Insert: {
          copiado_de?: string | null
          drive_id: string
          enviado_em?: string
          enviado_por: string
          formato: string
          hash_md5: string
          id?: string
          nome: string
          papel: Database["public"]["Enums"]["papel_do_arquivo"]
          tamanho: number
          versao_id: string
        }
        Update: {
          copiado_de?: string | null
          drive_id?: string
          enviado_em?: string
          enviado_por?: string
          formato?: string
          hash_md5?: string
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_do_arquivo"]
          tamanho?: number
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_da_versao_copiado_de_fkey"
            columns: ["copiado_de"]
            isOneToOne: false
            referencedRelation: "arquivos_da_versao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_da_versao_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_da_versao_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      autorizacoes: {
        Row: {
          criada_em: string
          criada_por: string | null
          email: string
          perfil: Database["public"]["Enums"]["perfil"]
        }
        Insert: {
          criada_em?: string
          criada_por?: string | null
          email: string
          perfil?: Database["public"]["Enums"]["perfil"]
        }
        Update: {
          criada_em?: string
          criada_por?: string | null
          email?: string
          perfil?: Database["public"]["Enums"]["perfil"]
        }
        Relationships: [
          {
            foreignKeyName: "autorizacoes_criada_por_fkey"
            columns: ["criada_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          ativa: boolean
          codigo: string
          criado_em: string
          id: string
          nome: string
          obrigatoria: boolean
          ordem: number
        }
        Insert: {
          ativa?: boolean
          codigo: string
          criado_em?: string
          id?: string
          nome: string
          obrigatoria: boolean
          ordem: number
        }
        Update: {
          ativa?: boolean
          codigo?: string
          criado_em?: string
          id?: string
          nome?: string
          obrigatoria?: boolean
          ordem?: number
        }
        Relationships: []
      }
      eventos: {
        Row: {
          acao: string
          autor_id: string | null
          detalhes: Json
          entidade: string
          entidade_ref: string
          id: number
          ocorrido_em: string
        }
        Insert: {
          acao: string
          autor_id?: string | null
          detalhes: Json
          entidade: string
          entidade_ref: string
          id?: never
          ocorrido_em?: string
        }
        Update: {
          acao?: string
          autor_id?: string | null
          detalhes?: Json
          entidade?: string
          entidade_ref?: string
          id?: never
          ocorrido_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      macroprocessos: {
        Row: {
          ativo: boolean
          categoria:
            | Database["public"]["Enums"]["categoria_macroprocesso"]
            | null
          codigo: string | null
          criado_em: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          categoria?:
            | Database["public"]["Enums"]["categoria_macroprocesso"]
            | null
          codigo?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          categoria?:
            | Database["public"]["Enums"]["categoria_macroprocesso"]
            | null
          codigo?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      pastas_no_drive: {
        Row: {
          drive_id: string
          id: string
          processo_id: string | null
          setor_id: string | null
        }
        Insert: {
          drive_id: string
          id?: string
          processo_id?: string | null
          setor_id?: string | null
        }
        Update: {
          drive_id?: string
          id?: string
          processo_id?: string | null
          setor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastas_no_drive_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: true
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastas_no_drive_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: true
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastas_no_drive_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: true
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          contexto: string | null
          criado_em: string
          data_da_reuniao: string | null
          id: string
          macroprocesso_id: string
          motivo_da_situacao: string | null
          nome: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_do_processo"]
          processo_pai_id: string | null
          setor_id: string
          situacao: Database["public"]["Enums"]["situacao_guardada"]
          tipo: Database["public"]["Enums"]["tipo_de_processo"]
        }
        Insert: {
          contexto?: string | null
          criado_em?: string
          data_da_reuniao?: string | null
          id?: string
          macroprocesso_id: string
          motivo_da_situacao?: string | null
          nome: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_do_processo"]
          processo_pai_id?: string | null
          setor_id: string
          situacao?: Database["public"]["Enums"]["situacao_guardada"]
          tipo?: Database["public"]["Enums"]["tipo_de_processo"]
        }
        Update: {
          contexto?: string | null
          criado_em?: string
          data_da_reuniao?: string | null
          id?: string
          macroprocesso_id?: string
          motivo_da_situacao?: string | null
          nome?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_do_processo"]
          processo_pai_id?: string | null
          setor_id?: string
          situacao?: Database["public"]["Enums"]["situacao_guardada"]
          tipo?: Database["public"]["Enums"]["tipo_de_processo"]
        }
        Relationships: [
          {
            foreignKeyName: "processos_envolvido_fkey"
            columns: ["macroprocesso_id", "setor_id"]
            isOneToOne: false
            referencedRelation: "setores_envolvidos"
            referencedColumns: ["macroprocesso_id", "setor_id"]
          },
          {
            foreignKeyName: "processos_macroprocesso_id_fkey"
            columns: ["macroprocesso_id"]
            isOneToOne: false
            referencedRelation: "macroprocessos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_processo_pai_id_fkey"
            columns: ["processo_pai_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_processo_pai_id_fkey"
            columns: ["processo_pai_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      revisoes_internas: {
        Row: {
          comentario: string | null
          escopo: Database["public"]["Enums"]["escopo_da_correcao"] | null
          id: string
          processo_id: string
          registrada_em: string
          resultado: Database["public"]["Enums"]["resultado_da_revisao"]
          revisada_em: string
          revisor_id: string
          versao_corrigida_id: string | null
          versao_revisada_id: string
        }
        Insert: {
          comentario?: string | null
          escopo?: Database["public"]["Enums"]["escopo_da_correcao"] | null
          id?: string
          processo_id: string
          registrada_em?: string
          resultado: Database["public"]["Enums"]["resultado_da_revisao"]
          revisada_em: string
          revisor_id: string
          versao_corrigida_id?: string | null
          versao_revisada_id: string
        }
        Update: {
          comentario?: string | null
          escopo?: Database["public"]["Enums"]["escopo_da_correcao"] | null
          id?: string
          processo_id?: string
          registrada_em?: string
          resultado?: Database["public"]["Enums"]["resultado_da_revisao"]
          revisada_em?: string
          revisor_id?: string
          versao_corrigida_id?: string | null
          versao_revisada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_internas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_internas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_internas_revisor_id_fkey"
            columns: ["revisor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_internas_versao_corrigida_id_fkey"
            columns: ["versao_corrigida_id"]
            isOneToOne: false
            referencedRelation: "versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisoes_internas_versao_revisada_id_fkey"
            columns: ["versao_revisada_id"]
            isOneToOne: false
            referencedRelation: "versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          observacoes: string | null
          sigla: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          observacoes?: string | null
          sigla: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          observacoes?: string | null
          sigla?: string
        }
        Relationships: []
      }
      setores_envolvidos: {
        Row: {
          criado_em: string
          macroprocesso_id: string
          observacao: string | null
          setor_id: string
        }
        Insert: {
          criado_em?: string
          macroprocesso_id: string
          observacao?: string | null
          setor_id: string
        }
        Update: {
          criado_em?: string
          macroprocesso_id?: string
          observacao?: string | null
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setores_envolvidos_macroprocesso_id_fkey"
            columns: ["macroprocesso_id"]
            isOneToOne: false
            referencedRelation: "macroprocessos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setores_envolvidos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          foto_url: string | null
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          primeiro_acesso_em: string
        }
        Insert: {
          ativo?: boolean
          foto_url?: string | null
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          primeiro_acesso_em?: string
        }
        Update: {
          ativo?: boolean
          foto_url?: string | null
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil"]
          primeiro_acesso_em?: string
        }
        Relationships: []
      }
      usuarios_emails: {
        Row: {
          email: string
          usuario_id: string
        }
        Insert: {
          email: string
          usuario_id: string
        }
        Update: {
          email?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_emails_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      versoes: {
        Row: {
          enviada_em: string
          enviada_por: string
          etapa_id: string | null
          historica: boolean
          id: string
          numero: number
          observacao: string | null
          processo_id: string
        }
        Insert: {
          enviada_em?: string
          enviada_por: string
          etapa_id?: string | null
          historica?: boolean
          id?: string
          numero: number
          observacao?: string | null
          processo_id: string
        }
        Update: {
          enviada_em?: string
          enviada_por?: string
          etapa_id?: string | null
          historica?: boolean
          id?: string
          numero?: number
          observacao?: string | null
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "versoes_enviada_por_fkey"
            columns: ["enviada_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versoes_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versoes_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["etapa_atual_id"]
          },
          {
            foreignKeyName: "versoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versoes_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      processos_com_andamento: {
        Row: {
          caminho: Json | null
          contexto: string | null
          criado_em: string | null
          data_da_reuniao: string | null
          etapa_atual_codigo: string | null
          etapa_atual_id: string | null
          etapa_atual_iniciada_em: string | null
          etapa_atual_nome: string | null
          etapa_atual_ordem: number | null
          etapa_atual_status:
            | Database["public"]["Enums"]["status_da_etapa"]
            | null
          id: string | null
          macroprocesso_id: string | null
          macroprocesso_nome: string | null
          motivo_da_situacao: string | null
          nome: string | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_do_processo"] | null
          processo_pai_id: string | null
          responsavel_ativo: boolean | null
          responsavel_foto_url: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          setor_id: string | null
          setor_sigla: string | null
          situacao: string | null
          situacao_guardada:
            | Database["public"]["Enums"]["situacao_guardada"]
            | null
          subprocessos_quantidade: number | null
          tipo: Database["public"]["Enums"]["tipo_de_processo"] | null
          ultima_versao_historica: boolean | null
          ultima_versao_numero: number | null
          ultima_versao_tem_relatorio: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_envolvido_fkey"
            columns: ["macroprocesso_id", "setor_id"]
            isOneToOne: false
            referencedRelation: "setores_envolvidos"
            referencedColumns: ["macroprocesso_id", "setor_id"]
          },
          {
            foreignKeyName: "processos_macroprocesso_id_fkey"
            columns: ["macroprocesso_id"]
            isOneToOne: false
            referencedRelation: "macroprocessos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_processo_pai_id_fkey"
            columns: ["processo_pai_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_processo_pai_id_fkey"
            columns: ["processo_pai_id"]
            isOneToOne: false
            referencedRelation: "processos_com_andamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acrescentar_etapa: {
        Args: {
          p_antes_de: string
          p_codigo: string
          p_nome: string
          p_obrigatoria: boolean
        }
        Returns: string
      }
      acrescentar_relatorio: {
        Args: { p_arquivo: Json; p_numero: number; p_versao: string }
        Returns: string
      }
      avancar_etapa: {
        Args: {
          p_acao: string
          p_andamento: string
          p_nota: string
          p_responsavel: string
        }
        Returns: undefined
      }
      cancelar_processo: {
        Args: { p_motivo: string; p_processo: string }
        Returns: undefined
      }
      concluir_revisao_interna: {
        Args: {
          p_andamento: string
          p_comentario: string
          p_escopo: Database["public"]["Enums"]["escopo_da_correcao"]
          p_responsavel: string
          p_resultado: Database["public"]["Enums"]["resultado_da_revisao"]
        }
        Returns: undefined
      }
      mover_etapa: {
        Args: { p_etapa: string; p_sentido: string }
        Returns: undefined
      }
      origem_do_relatorio: {
        Args: { p_versao: string }
        Returns: {
          arquivo_id: string
          drive_id: string
          formato: string
        }[]
      }
      reclassificar_processo: {
        Args: {
          p_motivo: string
          p_pai: string
          p_processo: string
          p_tipo: Database["public"]["Enums"]["tipo_de_processo"]
        }
        Returns: undefined
      }
      registrar_sem_alteracao: {
        Args: { p_arquivo: Json; p_versao: string }
        Returns: string
      }
      registrar_versao: {
        Args: {
          p_arquivos: Json
          p_numero: number
          p_observacao: string
          p_processo: string
        }
        Returns: string
      }
      registrar_versao_historica: {
        Args: {
          p_arquivos: Json
          p_numero: number
          p_observacao: string
          p_processo: string
        }
        Returns: string
      }
      retomar_processo: {
        Args: { p_motivo: string; p_processo: string }
        Returns: undefined
      }
      substituir_arquivo: {
        Args: { p_arquivo: string; p_novo: Json }
        Returns: string
      }
      suspender_processo: {
        Args: { p_motivo: string; p_processo: string }
        Returns: undefined
      }
      voltar_a_etapa: {
        Args: { p_andamento: string; p_motivo: string; p_responsavel: string }
        Returns: undefined
      }
    }
    Enums: {
      categoria_macroprocesso: "finalistico" | "apoio" | "gerencial"
      escopo_da_correcao: "fluxograma" | "relatorio" | "ambos"
      origem_do_processo: "novo" | "retomado"
      papel_do_arquivo: "bpmn" | "png" | "bpm" | "relatorio"
      perfil: "administrador" | "integrante_ep" | "consulta"
      resultado_da_revisao: "sem_alteracao" | "corrigida"
      situacao_guardada: "em_andamento" | "suspenso" | "cancelado"
      status_da_etapa:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "realizada_anteriormente"
        | "dispensada"
      tipo_de_processo: "processo" | "subprocesso" | "a_classificar"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      categoria_macroprocesso: ["finalistico", "apoio", "gerencial"],
      escopo_da_correcao: ["fluxograma", "relatorio", "ambos"],
      origem_do_processo: ["novo", "retomado"],
      papel_do_arquivo: ["bpmn", "png", "bpm", "relatorio"],
      perfil: ["administrador", "integrante_ep", "consulta"],
      resultado_da_revisao: ["sem_alteracao", "corrigida"],
      situacao_guardada: ["em_andamento", "suspenso", "cancelado"],
      status_da_etapa: [
        "pendente",
        "em_andamento",
        "concluida",
        "realizada_anteriormente",
        "dispensada",
      ],
      tipo_de_processo: ["processo", "subprocesso", "a_classificar"],
    },
  },
} as const
