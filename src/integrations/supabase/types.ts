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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      branch_users: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          receipt_footer: string | null
          receipt_header: string | null
          show_logo_on_receipt: boolean
          show_tax_on_receipt: boolean
          tax_id: string | null
          tax_name: string
          tax_rate: number
          thermal_paper_size: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          show_logo_on_receipt?: boolean
          show_tax_on_receipt?: boolean
          tax_id?: string | null
          tax_name?: string
          tax_rate?: number
          thermal_paper_size?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          show_logo_on_receipt?: boolean
          show_tax_on_receipt?: boolean
          tax_id?: string | null
          tax_name?: string
          tax_rate?: number
          thermal_paper_size?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashbox_movements: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          payment_method: string | null
          reference_id: string | null
          session_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          session_id: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          session_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashbox_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cashbox_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cashbox_sessions: {
        Row: {
          branch_id: string | null
          closed_at: string | null
          closing_amount: number | null
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashbox_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          receipt_footer: string | null
          receipt_header: string | null
          show_logo_on_receipt: boolean
          show_tax_on_receipt: boolean
          tax_id: string | null
          tax_name: string
          tax_rate: number
          thermal_paper_size: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          receipt_footer?: string | null
          receipt_header?: string | null
          show_logo_on_receipt?: boolean
          show_tax_on_receipt?: boolean
          tax_id?: string | null
          tax_name?: string
          tax_rate?: number
          thermal_paper_size?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          receipt_footer?: string | null
          receipt_header?: string | null
          show_logo_on_receipt?: boolean
          show_tax_on_receipt?: boolean
          tax_id?: string | null
          tax_name?: string
          tax_rate?: number
          thermal_paper_size?: string
          updated_at?: string
        }
        Relationships: []
      }
      courts: {
        Row: {
          branch_id: string | null
          closing_time: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          night_price_per_hour: number | null
          night_start_time: string | null
          opening_time: string
          price_per_hour: number
          sport_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          closing_time?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          night_price_per_hour?: number | null
          night_start_time?: string | null
          opening_time?: string
          price_per_hour?: number
          sport_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          closing_time?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          night_price_per_hour?: number | null
          night_start_time?: string | null
          opening_time?: string
          price_per_hour?: number
          sport_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_balance_movements: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          customer_id: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_balance_movements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          ar_iva_condition:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          balance: number
          branch_id: string | null
          created_at: string
          doc_number: string | null
          doc_type: Database["public"]["Enums"]["identity_doc_type"] | null
          email: string | null
          fiscal_email: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          ar_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          balance?: number
          branch_id?: string | null
          created_at?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["identity_doc_type"] | null
          email?: string | null
          fiscal_email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          ar_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          balance?: number
          branch_id?: string | null
          created_at?: string
          doc_number?: string | null
          doc_type?: Database["public"]["Enums"]["identity_doc_type"] | null
          email?: string | null
          fiscal_email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      document_series: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          current_number: number
          document_type: Database["public"]["Enums"]["fiscal_document_type"]
          id: string
          is_active: boolean
          is_default: boolean
          series: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          current_number?: number
          document_type: Database["public"]["Enums"]["fiscal_document_type"]
          id?: string
          is_active?: boolean
          is_default?: boolean
          series: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          current_number?: number
          document_type?: Database["public"]["Enums"]["fiscal_document_type"]
          id?: string
          is_active?: boolean
          is_default?: boolean
          series?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_series_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_series_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      electronic_invoices: {
        Row: {
          ar_customer_iva_condition:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          attempts: number
          branch_id: string | null
          cae: string | null
          cae_due_date: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cdr_response: Json | null
          company_id: string
          country: Database["public"]["Enums"]["fiscal_country"]
          created_at: string
          currency: string
          customer_address: string | null
          customer_doc_number: string | null
          customer_doc_type:
            | Database["public"]["Enums"]["identity_doc_type"]
            | null
          customer_email: string | null
          customer_id: string | null
          customer_legal_name: string | null
          document_type: Database["public"]["Enums"]["fiscal_document_type"]
          error_code: string | null
          error_message: string | null
          full_number: string | null
          hash: string | null
          id: string
          issue_date: string
          last_attempt_at: string | null
          metadata: Json | null
          number: number
          pdf_url: string | null
          qr_data: string | null
          reference_invoice_id: string | null
          sale_id: string | null
          series: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string
          xml_content: string | null
        }
        Insert: {
          ar_customer_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          attempts?: number
          branch_id?: string | null
          cae?: string | null
          cae_due_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cdr_response?: Json | null
          company_id: string
          country: Database["public"]["Enums"]["fiscal_country"]
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_doc_number?: string | null
          customer_doc_type?:
            | Database["public"]["Enums"]["identity_doc_type"]
            | null
          customer_email?: string | null
          customer_id?: string | null
          customer_legal_name?: string | null
          document_type: Database["public"]["Enums"]["fiscal_document_type"]
          error_code?: string | null
          error_message?: string | null
          full_number?: string | null
          hash?: string | null
          id?: string
          issue_date?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          number: number
          pdf_url?: string | null
          qr_data?: string | null
          reference_invoice_id?: string | null
          sale_id?: string | null
          series: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id: string
          xml_content?: string | null
        }
        Update: {
          ar_customer_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          attempts?: number
          branch_id?: string | null
          cae?: string | null
          cae_due_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cdr_response?: Json | null
          company_id?: string
          country?: Database["public"]["Enums"]["fiscal_country"]
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_doc_number?: string | null
          customer_doc_type?:
            | Database["public"]["Enums"]["identity_doc_type"]
            | null
          customer_email?: string | null
          customer_id?: string | null
          customer_legal_name?: string | null
          document_type?: Database["public"]["Enums"]["fiscal_document_type"]
          error_code?: string | null
          error_message?: string | null
          full_number?: string | null
          hash?: string | null
          id?: string
          issue_date?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          number?: number
          pdf_url?: string | null
          qr_data?: string | null
          reference_invoice_id?: string | null
          sale_id?: string | null
          series?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electronic_invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_invoices_reference_invoice_id_fkey"
            columns: ["reference_invoice_id"]
            isOneToOne: false
            referencedRelation: "electronic_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_settings: {
        Row: {
          ar_activity_start: string | null
          ar_gross_income: string | null
          ar_iva_condition:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          ar_point_of_sale: number | null
          auto_send: boolean
          company_id: string
          country: Database["public"]["Enums"]["fiscal_country"]
          created_at: string
          default_currency: string
          enabled: boolean
          fiscal_address: string | null
          id: string
          legal_name: string | null
          mode: Database["public"]["Enums"]["fiscal_mode"]
          pe_company_code: string | null
          send_email_to_customer: boolean
          tax_id: string | null
          trade_name: string | null
          ubigeo: string | null
          updated_at: string
        }
        Insert: {
          ar_activity_start?: string | null
          ar_gross_income?: string | null
          ar_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          ar_point_of_sale?: number | null
          auto_send?: boolean
          company_id: string
          country?: Database["public"]["Enums"]["fiscal_country"]
          created_at?: string
          default_currency?: string
          enabled?: boolean
          fiscal_address?: string | null
          id?: string
          legal_name?: string | null
          mode?: Database["public"]["Enums"]["fiscal_mode"]
          pe_company_code?: string | null
          send_email_to_customer?: boolean
          tax_id?: string | null
          trade_name?: string | null
          ubigeo?: string | null
          updated_at?: string
        }
        Update: {
          ar_activity_start?: string | null
          ar_gross_income?: string | null
          ar_iva_condition?:
            | Database["public"]["Enums"]["ar_iva_condition"]
            | null
          ar_point_of_sale?: number | null
          auto_send?: boolean
          company_id?: string
          country?: Database["public"]["Enums"]["fiscal_country"]
          created_at?: string
          default_currency?: string
          enabled?: boolean
          fiscal_address?: string | null
          id?: string
          legal_name?: string | null
          mode?: Database["public"]["Enums"]["fiscal_mode"]
          pe_company_code?: string | null
          send_email_to_customer?: boolean
          tax_id?: string | null
          trade_name?: string | null
          ubigeo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          discount: number
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          unit_code: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount?: number
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit_code?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount?: number
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit_code?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "electronic_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          company_id: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          is_custom: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_custom?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          branch_id: string | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number
          stock: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          stock?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          stock?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          purchase_id: string
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          purchase_id: string
          quantity?: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          purchase_id?: string
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          branch_id: string | null
          created_at: string
          document_number: string | null
          document_type: string
          id: string
          notes: string | null
          purchase_date: string
          status: string
          subtotal: number
          supplier_id: string | null
          tax: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          branch_id: string | null
          court_id: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          end_time: string
          id: string
          notes: string | null
          reservation_date: string
          start_time: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          court_id: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          end_time: string
          id?: string
          notes?: string | null
          reservation_date: string
          start_time: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          court_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          reservation_date?: string
          start_time?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          payment_method: string
          session_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          payment_method: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          payment_method?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cashbox_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          branch_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          ruc: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          ruc?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          ruc?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_invoice_number: {
        Args: {
          _company_id: string
          _document_type: Database["public"]["Enums"]["fiscal_document_type"]
          _series: string
        }
        Returns: number
      }
      get_user_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      onboard_company: {
        Args: {
          _branch_address?: string
          _branch_name: string
          _company_name: string
        }
        Returns: Json
      }
      seed_default_document_series: {
        Args: {
          _company_id: string
          _country: Database["public"]["Enums"]["fiscal_country"]
        }
        Returns: undefined
      }
      seed_default_payment_methods: {
        Args: { _company_id: string }
        Returns: undefined
      }
      user_belongs_to_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_module_access: {
        Args: { _company_id: string; _module: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "cashier"
      ar_iva_condition:
        | "responsable_inscripto"
        | "monotributo"
        | "exento"
        | "consumidor_final"
        | "no_responsable"
        | "no_categorizado"
      fiscal_country: "PE" | "AR"
      fiscal_document_type:
        | "pe_boleta"
        | "pe_factura"
        | "pe_nota_credito"
        | "pe_nota_debito"
        | "pe_guia_remision"
        | "ar_factura_a"
        | "ar_factura_b"
        | "ar_factura_c"
        | "ar_factura_e"
        | "ar_nota_credito_a"
        | "ar_nota_credito_b"
        | "ar_nota_credito_c"
        | "ar_nota_credito_e"
        | "ar_nota_debito_a"
        | "ar_nota_debito_b"
        | "ar_nota_debito_c"
        | "ar_nota_debito_e"
      fiscal_mode: "testing" | "production"
      identity_doc_type:
        | "pe_dni"
        | "pe_ruc"
        | "pe_ce"
        | "pe_pasaporte"
        | "pe_sin_doc"
        | "ar_dni"
        | "ar_cuit"
        | "ar_cuil"
        | "ar_pasaporte"
        | "ar_cf"
      invoice_status:
        | "pending"
        | "processing"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "error"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "cashier"],
      ar_iva_condition: [
        "responsable_inscripto",
        "monotributo",
        "exento",
        "consumidor_final",
        "no_responsable",
        "no_categorizado",
      ],
      fiscal_country: ["PE", "AR"],
      fiscal_document_type: [
        "pe_boleta",
        "pe_factura",
        "pe_nota_credito",
        "pe_nota_debito",
        "pe_guia_remision",
        "ar_factura_a",
        "ar_factura_b",
        "ar_factura_c",
        "ar_factura_e",
        "ar_nota_credito_a",
        "ar_nota_credito_b",
        "ar_nota_credito_c",
        "ar_nota_credito_e",
        "ar_nota_debito_a",
        "ar_nota_debito_b",
        "ar_nota_debito_c",
        "ar_nota_debito_e",
      ],
      fiscal_mode: ["testing", "production"],
      identity_doc_type: [
        "pe_dni",
        "pe_ruc",
        "pe_ce",
        "pe_pasaporte",
        "pe_sin_doc",
        "ar_dni",
        "ar_cuit",
        "ar_cuil",
        "ar_pasaporte",
        "ar_cf",
      ],
      invoice_status: [
        "pending",
        "processing",
        "accepted",
        "rejected",
        "cancelled",
        "error",
      ],
    },
  },
} as const
