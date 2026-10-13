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
          resolvida_em: string | null
          responsavel_id: string | null
          setor_id: string
          status: Database["public"]["Enums"]["status_da_etapa"]
        }
        Insert: {
          etapa_id: string
          id?: string
          iniciada_em?: string | null
          nota?: string | null
          resolvida_em?: string | null
          responsavel_id?: string | null
          setor_id: string
          status?: Database["public"]["Enums"]["status_da_etapa"]
        }
        Update: {
          etapa_id?: string
          id?: string
          iniciada_em?: string | null
          nota?: string | null
          resolvida_em?: string | null
          responsavel_id?: string | null
          setor_id?: string
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
            foreignKeyName: "andamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "andamentos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
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
          nivel: Database["public"]["Enums"]["nivel_da_etapa"]
          nome: string
          obrigatoria: boolean
          ordem: number
        }
        Insert: {
          ativa?: boolean
          codigo: string
          criado_em?: string
          id?: string
          nivel: Database["public"]["Enums"]["nivel_da_etapa"]
          nome: string
          obrigatoria: boolean
          ordem: number
        }
        Update: {
          ativa?: boolean
          codigo?: string
          criado_em?: string
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_da_etapa"]
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
      responsaveis_do_setor: {
        Row: {
          cargo: string | null
          criado_em: string
          email: string | null
          id: string
          nome: string
          setor_id: string
        }
        Insert: {
          cargo?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome: string
          setor_id: string
        }
        Update: {
          cargo?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_do_setor_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_macroprocesso: "finalistico" | "apoio" | "gerencial"
      nivel_da_etapa: "setor" | "processo"
      perfil: "administrador" | "integrante_ep" | "consulta"
      status_da_etapa:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "realizada_anteriormente"
        | "dispensada"
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
      nivel_da_etapa: ["setor", "processo"],
      perfil: ["administrador", "integrante_ep", "consulta"],
      status_da_etapa: [
        "pendente",
        "em_andamento",
        "concluida",
        "realizada_anteriormente",
        "dispensada",
      ],
    },
  },
} as const
