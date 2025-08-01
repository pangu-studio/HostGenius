import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 获取保存的语言设置
const getInitialLanguage = async () => {
  try {
    // 如果electron API可用，从设置文件获取
    if (window.electronAPI?.loadSettings) {
      const settings = await window.electronAPI.loadSettings();
      return settings.language || "zh-CN";
    }

    // 降级到localStorage（开发模式或electron API不可用时）
    const stored = localStorage.getItem("hostgenius-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.language || "zh-CN";
    }
  } catch (error) {
    console.warn("Failed to load language setting:", error);
  }
  return "zh-CN";
};

// 使用异步初始化
const initializeI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  return i18n.use(initReactI18next).init({
    fallbackLng: "zh-CN",
    lng: initialLanguage,
    resources: {
      en: {
        translation: {
          appName: "Host Genius",
          titleHomePage: "Home Page",
          titleSecondPage: "Second Page",
          // Host管理相关翻译
          hosts: {
            title: "Host Management",
            description: "Categorize and manage your host configurations",
            groups: "Groups",
            systemHosts: "System Hosts",
            systemHostsView: "System Hosts View",
            createGroup: "Create Group",
            editGroup: "Edit Group",
            deleteGroup: "Delete Group",
            applyToSystem: "Apply to System",
            backup: "Backup",
            restore: "Restore",
            export: "Export",
            import: "Import",
            enabled: "Enabled",
            disabled: "Disabled",
            name: "Name",
            content: "Content",
            ipAddress: "IP Address",
            domain: "Domain",
            comment: "Comment",
            actions: "Actions",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            add: "Add",
            loading: "Loading...",
            success: "Success",
            error: "Error",
            confirmDelete: "Are you sure you want to delete this group?",
            permissionRequired: "Administrator permission required",
            requestPermission: "Request Permission",
            // 系统Hosts查看相关
            systemView: {
              title: "System Hosts View",
              readOnlyMode: "Read Only",
              textView: "Text View",
              tableView: "Table View",
              search: "Search IP, domain or comment...",
              refresh: "Refresh",
              copyContent: "Copy Content",
              copied: "Copied",
              fileContent: "File Content",
              hostEntries: "Host Entries",
              totalLines: "Total Lines",
              hostLines: "Host Entries",
              enabledHosts: "Enabled",
              commentLines: "Comments",
              emptyLines: "Empty Lines",
              filteredEntries: "Search Results",
              fileSize: "File Size",
              showingLines: "Showing {{count}} lines",
              showingEntries: "Showing {{filtered}} / {{total}} entries",
              searchResults: 'Search: "{{term}}"',
              noResults: 'No host entries found containing "{{term}}"',
              clearSearch: "Clear Search",
              noEntries: "No valid host entries in system hosts file",
              emptyFile: "(File is empty)",
              status: "Status",
              refreshSuccess: "System hosts file refreshed",
              copySuccess: "Content copied to clipboard",
              copyError: "Copy failed",
              loadError: "Failed to load system hosts file",
              rowCopySuccess: "Copied to clipboard",
              rowCopyError: "Copy failed",
            },
            // 新增翻译条目
            groupEnabled: 'Group "{{name}}" enabled',
            groupDisabled: 'Group "{{name}}" disabled',
            toggleGroupError: "Failed to toggle group status",
            groupDeleted: 'Group "{{name}}" deleted',
            deleteGroupError: "Failed to delete group",
            applySuccess: "Hosts configuration applied to system",
            applyError:
              "Failed to apply hosts configuration, please check permissions",
            exportSuccess: 'Group "{{name}}" exported',
            exportError: "Failed to export group configuration",
            statusLocal: "Local",
            statusSynced: "Synced",
            statusPending: "Pending",
            statusConflict: "Conflict",
            systemLabel: "System",
            version: "Version",
            createdAt: "Created",
            updatedAt: "Updated",
            viewContent: "View Content",
            lines: "lines",
            emptyContent: "(Empty)",
            confirmDeleteTitle: "Confirm Delete Group",
            confirmDeleteMessage:
              'Are you sure you want to delete group "{{name}}"?\n\n⚠️ Warning: This action will permanently delete:\n• All host configurations in this group\n• Complete version history\n• All related data\n\nThis action cannot be undone.',
            readSystemHostsError: "Failed to read system hosts",
            nameRequired: "Please enter group name",
            updateSuccess: 'Group "{{name}}" updated',
            createSuccess: 'Group "{{name}}" created',
            updateError: "Update failed",
            createError: "Create failed",
            fullscreenEdit: "Fullscreen Edit",
            newGroup: "New Group",
            exitFullscreen: "Exit Fullscreen",
            saving: "Saving...",
            totalEntries: "Total {{count}} entries",
            enabledEntries: "Enabled {{count}} entries",
            contentPlaceholder:
              "127.0.0.1 localhost\n192.168.1.100 api.example.com # Development environment",
            addEntry: "Add Entry",
            optionalComment: "Optional comment",
            noEntries: "No hosts entries",
            addFirstEntry: "Add First Entry",
            back: "Back",
            basicInfo: "Basic Information",
            namePlaceholder: "Enter group name",
            enableGroup: "Enable Group",
            descriptionPlaceholder: "Enter group description (optional)",
            hostsConfig: "Hosts Configuration",
            groupInfo: "Group Information",
            syncStatus: "Sync Status",
          },
          // 设置页面相关翻译
          settings: {
            title: "Settings",
            description: "Customize your application preferences",
            autoSaved: "Auto-saved",
            theme: {
              title: "Theme",
              description: "Choose your preferred theme",
              light: "Light",
              dark: "Dark",
              system: "System",
              currentTheme: "Current theme: {{theme}}",
            },
            language: {
              title: "Language",
              description: "Select your preferred language",
              currentLanguage: "Current language: {{language}}",
            },
            about: {
              title: "About",
              version: "Version",
              description:
                "Host Genius is a powerful hosts file management tool",
            },
            general: {
              title: "General",
              description: "General application settings",
            },
            dataManagement: {
              title: "Data Management",
              description: "Manage application data and backups",
              openDataDirectory: "Open Data Directory",
              clearCache: "Clear Cache",
              comingSoon: "(Coming Soon)",
              warning:
                "Warning: Do not delete any files or folders in the data directory, as this may result in data loss.",
            },
          },
        },
      },
      "zh-CN": {
        translation: {
          appName: "Host Genius",
          titleHomePage: "系统概览",
          titleSecondPage: "第二页",
          // Host管理相关翻译
          hosts: {
            title: "分组管理",
            description: "分类管理您的host配置",
            groups: "分组",
            systemHosts: "系统Hosts",
            systemHostsView: "系统Hosts查看",
            createGroup: "新建分组",
            editGroup: "编辑分组",
            deleteGroup: "删除分组",
            applyToSystem: "应用到系统",
            backup: "备份",
            restore: "恢复",
            export: "导出",
            import: "导入",
            enabled: "启用",
            disabled: "禁用",
            name: "名称",
            content: "内容",
            ipAddress: "IP地址",
            domain: "域名",
            comment: "备注",
            actions: "操作",
            save: "保存",
            cancel: "取消",
            delete: "删除",
            edit: "编辑",
            add: "添加",
            loading: "加载中...",
            success: "成功",
            error: "错误",
            confirmDelete: "确定要删除这个分组吗？",
            permissionRequired: "需要管理员权限",
            requestPermission: "获取权限",
            // 系统Hosts查看相关
            systemView: {
              actions: "操作",
              title: "系统Hosts查看",
              readOnlyMode: "只读模式",
              textView: "文本查看",
              tableView: "表格查看",
              search: "搜索IP、域名或注释...",
              refresh: "刷新",
              copyContent: "复制内容",
              copied: "已复制",
              fileContent: "文件内容",
              hostEntries: "Hosts条目",
              totalLines: "总行数",
              hostLines: "hosts条目",
              enabledHosts: "启用条目",
              commentLines: "注释行",
              emptyLines: "空行",
              filteredEntries: "搜索结果",
              fileSize: "文件大小",
              showingLines: "显示 {{count}} 行",
              showingEntries: "显示 {{filtered}} / {{total}} 条",
              searchResults: '搜索: "{{term}}"',
              noResults: '未找到包含 "{{term}}" 的hosts条目',
              clearSearch: "清除搜索",
              noEntries: "系统hosts文件中没有有效的hosts条目",
              emptyFile: "(文件为空)",
              status: "状态",
              refreshSuccess: "系统hosts文件已刷新",
              copySuccess: "内容已复制到剪贴板",
              copyError: "复制失败",
              loadError: "读取系统hosts文件失败",
              rowCopySuccess: "已复制到剪贴板",
              rowCopyError: "复制失败",
            },
            // 新增翻译条目
            groupEnabled: '分组 "{{name}}" 已启用',
            groupDisabled: '分组 "{{name}}" 已禁用',
            toggleGroupError: "切换分组状态失败",
            groupDeleted: '分组 "{{name}}" 已删除',
            deleteGroupError: "无法删除分组，请重试",
            applySuccess: "Hosts配置已应用到系统",
            applyError: "应用Hosts配置失败，请检查权限",
            exportSuccess: '分组 "{{name}}" 已导出',
            exportError: "导出分组配置失败",
            statusLocal: "本地",
            statusSynced: "已同步",
            statusPending: "待同步",
            statusConflict: "冲突",
            systemLabel: "系统",
            version: "版本",
            createdAt: "创建时间",
            updatedAt: "更新时间",
            viewContent: "查看内容",
            lines: "行",
            emptyContent: "(空)",
            confirmDeleteTitle: "确认删除分组",
            confirmDeleteMessage:
              '你确定要删除分组 "{{name}}" 吗？\n\n⚠️ 警告：此操作将永久删除：\n• 该分组中的所有hosts配置\n• 完整的版本历史记录\n• 所有相关数据\n\n此操作无法撤销。',
            readSystemHostsError: "读取系统hosts失败",
            nameRequired: "请输入分组名称",
            updateSuccess: '分组 "{{name}}" 已更新',
            createSuccess: '分组 "{{name}}" 已创建',
            updateError: "更新失败",
            createError: "创建失败",
            fullscreenEdit: "全屏编辑",
            newGroup: "新建分组",
            exitFullscreen: "退出全屏",
            saving: "保存中...",
            totalEntries: "共 {{count}} 条有效记录",
            enabledEntries: "启用 {{count}} 条",
            contentPlaceholder:
              "127.0.0.1 localhost\n192.168.1.100 api.example.com # 开发环境",
            addEntry: "添加条目",
            optionalComment: "可选备注",
            noEntries: "暂无hosts条目",
            addFirstEntry: "添加第一条记录",
            back: "返回",
            basicInfo: "基本信息",
            namePlaceholder: "输入分组名称",
            enableGroup: "启用分组",
            descriptionPlaceholder: "输入分组描述（可选）",
            hostsConfig: "Hosts 配置",
            groupInfo: "分组信息",
            syncStatus: "同步状态",
          },
          // 设置页面相关翻译
          settings: {
            title: "系统设置",
            description: "自定义您的应用偏好设置",
            autoSaved: "自动保存",
            theme: {
              title: "主题",
              description: "选择您喜欢的主题",
              light: "浅色",
              dark: "深色",
              system: "跟随系统",
              currentTheme: "当前主题：{{theme}}",
            },
            language: {
              title: "语言",
              description: "选择您的首选语言",
              currentLanguage: "当前语言：{{language}}",
            },
            about: {
              title: "关于",
              version: "版本",
              description:
                "Host Genius 是由 Pangu Studio 开发的一款功能强大的 hosts 文件管理工具",
            },
            general: {
              title: "通用",
              description: "通用应用设置",
            },
            dataManagement: {
              title: "数据管理",
              description: "管理应用数据和备份",
              openDataDirectory: "打开数据目录",
              clearCache: "清理缓存",
              comingSoon: "(即将推出)",
              warning:
                "温馨提示：请勿删除数据目录中的任何文件或文件夹，否则可能导致数据丢失。",
            },
          },
        },
      },
      "pt-BR": {
        translation: {
          appName: "Host Genius",
          titleHomePage: "Página Inicial",
          titleSecondPage: "Segunda Página",
          // Host管理相关翻译
          hosts: {
            title: "Gerenciamento de Hosts",
            description: "Categorize e gerencie suas configurações de host",
            groups: "Grupos",
            systemHosts: "Hosts do Sistema",
            systemHostsView: "Visualização de Hosts do Sistema",
            createGroup: "Criar Grupo",
            editGroup: "Editar Grupo",
            deleteGroup: "Excluir Grupo",
            applyToSystem: "Aplicar ao Sistema",
            backup: "Backup",
            restore: "Restaurar",
            export: "Exportar",
            import: "Importar",
            enabled: "Habilitado",
            disabled: "Desabilitado",
            name: "Nome",
            content: "Conteúdo",
            ipAddress: "Endereço IP",
            domain: "Domínio",
            comment: "Comentário",
            actions: "Ações",
            save: "Salvar",
            cancel: "Cancelar",
            delete: "Excluir",
            edit: "Editar",
            add: "Adicionar",
            loading: "Carregando...",
            success: "Sucesso",
            error: "Erro",
            confirmDelete: "Tem certeza de que deseja excluir este grupo?",
            permissionRequired: "Permissão de administrador necessária",
            requestPermission: "Solicitar Permissão",
            // 系统Hosts查看相关
            systemView: {
              title: "Visualização de Hosts do Sistema",
              readOnlyMode: "Somente Leitura",
              textView: "Visualização de Texto",
              tableView: "Visualização de Tabela",
              search: "Pesquisar IP, domínio ou comentário...",
              refresh: "Atualizar",
              copyContent: "Copiar Conteúdo",
              copied: "Copiado",
              fileContent: "Conteúdo do Arquivo",
              hostEntries: "Entradas de Host",
              totalLines: "Linhas Totais",
              hostLines: "entradas de host",
              enabledHosts: "habilitado",
              commentLines: "comentários",
              emptyLines: "linhas vazias",
              filteredEntries: "resultados da pesquisa",
              fileSize: "tamanho do arquivo",
              showingLines: "Mostrando {{count}} linhas",
              showingEntries: "Mostrando {{filtered}} / {{total}} entradas",
              searchResults: 'Pesquisa: "{{term}}"',
              noResults:
                'Nenhuma entrada de host encontrada contendo "{{term}}"',
              clearSearch: "Limpar Pesquisa",
              noEntries:
                "Nenhuma entrada de host válida no arquivo hosts do sistema",
              emptyFile: "(Arquivo vazio)",
              status: "Status",
              refreshSuccess: "Arquivo hosts do sistema atualizado",
              copySuccess: "Conteúdo copiado para a área de transferência",
              copyError: "Falha ao copiar",
              loadError: "Falha ao carregar o arquivo hosts do sistema",
              rowCopySuccess: "Copiado para a área de transferência",
              rowCopyError: "Falha ao copiar",
            },
            // 新增翻译条目
            groupEnabled: 'Group "{{name}}" enabled',
            groupDisabled: 'Group "{{name}}" disabled',
            toggleGroupError: "Failed to toggle group status",
            groupDeleted: 'Group "{{name}}" deleted',
            deleteGroupError: "Failed to delete group",
            applySuccess: "Hosts configuration applied to system",
            applyError:
              "Failed to apply hosts configuration, please check permissions",
            exportSuccess: 'Group "{{name}}" exported',
            exportError: "Failed to export group configuration",
            statusLocal: "Local",
            statusSynced: "Synced",
            statusPending: "Pending",
            statusConflict: "Conflict",
            systemLabel: "System",
            version: "Version",
            createdAt: "Created",
            updatedAt: "Updated",
            viewContent: "View Content",
            lines: "lines",
            emptyContent: "(Empty)",
            confirmDeleteTitle: "Confirmar Exclusão de Grupo",
            confirmDeleteMessage:
              'Tem certeza de que deseja excluir o grupo "{{name}}"?\n\n⚠️ Aviso: Esta ação excluirá permanentemente:\n• Todas as configurações de host neste grupo\n• Histórico completo de versões\n• Todos os dados relacionados\n\nEsta ação não pode ser desfeita.',
            readSystemHostsError: "Failed to read system hosts",
            nameRequired: "Please enter group name",
            updateSuccess: 'Group "{{name}}" updated',
            createSuccess: 'Group "{{name}}" created',
            updateError: "Update failed",
            createError: "Create failed",
            fullscreenEdit: "Fullscreen Edit",
            newGroup: "New Group",
            exitFullscreen: "Exit Fullscreen",
            saving: "Saving...",
            totalEntries: "Total {{count}} entries",
            enabledEntries: "Enabled {{count}} entries",
            contentPlaceholder:
              "127.0.0.1 localhost\n192.168.1.100 api.example.com # Development environment",
            addEntry: "Add Entry",
            optionalComment: "Optional comment",
            noEntries: "No hosts entries",
            addFirstEntry: "Add First Entry",
            back: "Back",
            basicInfo: "Basic Information",
            namePlaceholder: "Enter group name",
            enableGroup: "Enable Group",
            descriptionPlaceholder: "Enter group description (optional)",
            hostsConfig: "Hosts Configuration",
            groupInfo: "Group Information",
            syncStatus: "Sync Status",
          },
          // 设置页面相关翻译
          settings: {
            title: "Configurações",
            description: "Personalize suas preferências do aplicativo",
            autoSaved: "Salvo automaticamente",
            theme: {
              title: "Tema",
              description: "Escolha seu tema preferido",
              light: "Claro",
              dark: "Escuro",
              system: "Sistema",
              currentTheme: "Tema atual: {{theme}}",
            },
            language: {
              title: "Idioma",
              description: "Selecione seu idioma preferido",
              currentLanguage: "Idioma atual: {{language}}",
            },
            about: {
              title: "Sobre",
              version: "Versão",
              description:
                "Host Genius é uma ferramenta poderosa de gerenciamento de arquivo hosts",
            },
            general: {
              title: "Geral",
              description: "Configurações gerais do aplicativo",
            },
            dataManagement: {
              title: "Gerenciamento de Dados",
              description: "Gerencie dados e backups do aplicativo",
              openDataDirectory: "Abrir Diretório de Dados",
              clearCache: "Limpar Cache",
              comingSoon: "(Em Breve)",
              warning:
                "Aviso: Não exclua nenhum arquivo ou pasta no diretório de dados, pois isso pode resultar em perda de dados.",
            },
          },
        },
      },
      ja: {
        translation: {
          appName: "Host Genius",
          titleHomePage: "ホーム",
          titleSecondPage: "セカンドページ",
          hosts: {
            title: "ホスト管理",
            description: "ホスト設定を分類・管理",
            groups: "グループ",
            systemHosts: "システムHosts",
            systemHostsView: "システムHosts表示",
            createGroup: "グループ作成",
            editGroup: "グループ編集",
            deleteGroup: "グループ削除",
            applyToSystem: "システムに適用",
            backup: "バックアップ",
            restore: "復元",
            export: "エクスポート",
            import: "インポート",
            enabled: "有効",
            disabled: "無効",
            name: "名前",
            content: "内容",
            ipAddress: "IPアドレス",
            domain: "ドメイン",
            comment: "コメント",
            actions: "操作",
            save: "保存",
            cancel: "キャンセル",
            delete: "削除",
            edit: "編集",
            add: "追加",
            loading: "読み込み中...",
            success: "成功",
            error: "エラー",
            confirmDelete: "このグループを削除してもよろしいですか？",
            permissionRequired: "管理者権限が必要です",
            requestPermission: "権限を要求",
            systemView: {
              title: "システムHosts表示",
              readOnlyMode: "読み取り専用",
              textView: "テキスト表示",
              tableView: "テーブル表示",
              search: "IP、ドメイン、コメントを検索...",
              refresh: "更新",
              copyContent: "内容をコピー",
              copied: "コピー完了",
              fileContent: "ファイル内容",
              hostEntries: "Hostsエントリ",
              totalLines: "総行数",
              hostLines: "hostsエントリ",
              enabledHosts: "有効",
              commentLines: "コメント行",
              emptyLines: "空行",
              filteredEntries: "検索結果",
              fileSize: "ファイルサイズ",
              showingLines: "{{count}} 行を表示",
              showingEntries: "{{filtered}} / {{total}} エントリを表示",
              searchResults: '検索: "{{term}}"',
              noResults: '"{{term}}" を含むhostsエントリが見つかりません',
              clearSearch: "検索をクリア",
              noEntries:
                "システムhostsファイルに有効なhostsエントリがありません",
              emptyFile: "(ファイルが空です)",
              status: "ステータス",
              refreshSuccess: "システムhostsファイルを更新しました",
              copySuccess: "内容をクリップボードにコピーしました",
              copyError: "コピーに失敗しました",
              loadError: "システムhostsファイルの読み込みに失敗しました",
              rowCopySuccess: "クリップボードにコピーしました",
              rowCopyError: "コピーに失敗しました",
            },
            // 新增翻译条目
            groupEnabled: 'Group "{{name}}" enabled',
            groupDisabled: 'Group "{{name}}" disabled',
            toggleGroupError: "Failed to toggle group status",
            groupDeleted: 'Group "{{name}}" deleted',
            deleteGroupError: "Failed to delete group",
            applySuccess: "Hosts configuration applied to system",
            applyError:
              "Failed to apply hosts configuration, please check permissions",
            exportSuccess: 'Group "{{name}}" exported',
            exportError: "Failed to export group configuration",
            statusLocal: "Local",
            statusSynced: "Synced",
            statusPending: "Pending",
            statusConflict: "Conflict",
            systemLabel: "System",
            version: "Version",
            createdAt: "Created",
            updatedAt: "Updated",
            viewContent: "View Content",
            lines: "lines",
            emptyContent: "(Empty)",
            confirmDeleteTitle: "グループ削除の確認",
            confirmDeleteMessage:
              'グループ "{{name}}" を削除してもよろしいですか？\n\n⚠️ 警告：この操作により以下が永久に削除されます：\n• このグループ内のすべてのホスト設定\n• 完全なバージョン履歴\n• すべての関連データ\n\nこの操作は元に戻せません。',
            readSystemHostsError: "Failed to read system hosts",
            nameRequired: "Please enter group name",
            updateSuccess: 'Group "{{name}}" updated',
            createSuccess: 'Group "{{name}}" created',
            updateError: "Update failed",
            createError: "Create failed",
            fullscreenEdit: "Fullscreen Edit",
            newGroup: "New Group",
            exitFullscreen: "Exit Fullscreen",
            saving: "Saving...",
            totalEntries: "Total {{count}} entries",
            enabledEntries: "Enabled {{count}} entries",
            contentPlaceholder:
              "127.0.0.1 localhost\n192.168.1.100 api.example.com # Development environment",
            addEntry: "Add Entry",
            optionalComment: "Optional comment",
            noEntries: "No hosts entries",
            addFirstEntry: "Add First Entry",
            back: "Back",
            basicInfo: "Basic Information",
            namePlaceholder: "Enter group name",
            enableGroup: "Enable Group",
            descriptionPlaceholder: "Enter group description (optional)",
            hostsConfig: "Hosts Configuration",
            groupInfo: "Group Information",
            syncStatus: "Sync Status",
          },
          settings: {
            title: "設定",
            description: "アプリケーションの設定をカスタマイズ",
            autoSaved: "自動保存",
            theme: {
              title: "テーマ",
              description: "お好みのテーマを選択",
              light: "ライト",
              dark: "ダーク",
              system: "システム",
              currentTheme: "現在のテーマ：{{theme}}",
            },
            language: {
              title: "言語",
              description: "お好みの言語を選択",
              currentLanguage: "現在の言語：{{language}}",
            },
            about: {
              title: "について",
              version: "バージョン",
              description: "Host Genius は強力な hosts ファイル管理ツールです",
            },
            general: {
              title: "一般",
              description: "一般的なアプリケーション設定",
            },
            dataManagement: {
              title: "データ管理",
              description: "アプリケーションデータとバックアップを管理",
              openDataDirectory: "データディレクトリを開く",
              clearCache: "キャッシュをクリア",
              comingSoon: "(近日公開)",
              warning:
                "警告：データディレクトリ内のファイルやフォルダを削除しないでください。データ損失の原因となる可能性があります。",
            },
          },
        },
      },
      ko: {
        translation: {
          appName: "Host Genius",
          titleHomePage: "홈",
          titleSecondPage: "두 번째 페이지",
          hosts: {
            title: "호스트 관리",
            description: "호스트 구성을 분류하고 관리",
            groups: "그룹",
            systemHosts: "시스템 Hosts",
            systemHostsView: "시스템 Hosts 보기",
            createGroup: "그룹 생성",
            editGroup: "그룹 편집",
            deleteGroup: "그룹 삭제",
            applyToSystem: "시스템에 적용",
            backup: "백업",
            restore: "복원",
            export: "내보내기",
            import: "가져오기",
            enabled: "활성화",
            disabled: "비활성화",
            name: "이름",
            content: "내용",
            ipAddress: "IP 주소",
            domain: "도메인",
            comment: "설명",
            actions: "작업",
            save: "저장",
            cancel: "취소",
            delete: "삭제",
            edit: "편집",
            add: "추가",
            loading: "로딩 중...",
            success: "성공",
            error: "오류",
            confirmDelete: "이 그룹을 삭제하시겠습니까?",
            permissionRequired: "관리자 권한이 필요합니다",
            requestPermission: "권한 요청",
            systemView: {
              title: "시스템 Hosts 보기",
              readOnlyMode: "읽기 전용",
              textView: "텍스트 보기",
              tableView: "테이블 보기",
              search: "IP, 도메인 또는 설명 검색...",
              refresh: "새로 고침",
              copyContent: "내용 복사",
              copied: "복사됨",
              fileContent: "파일 내용",
              hostEntries: "호스트 항목",
              totalLines: "총 줄 수",
              hostLines: "호스트 항목",
              enabledHosts: "활성화됨",
              commentLines: "주석 줄",
              emptyLines: "빈 줄",
              filteredEntries: "검색 결과",
              fileSize: "파일 크기",
              showingLines: "{{count}} 줄 표시",
              showingEntries: "{{filtered}} / {{total}} 항목 표시",
              searchResults: '검색: "{{term}}"',
              noResults: '"{{term}}"이 포함된 호스트 항목을 찾을 수 없습니다',
              clearSearch: "검색 지우기",
              noEntries: "시스템 hosts 파일에 유효한 호스트 항목이 없습니다",
              emptyFile: "(파일이 비어 있음)",
              status: "상태",
              refreshSuccess: "시스템 hosts 파일이 새로 고쳐졌습니다",
              copySuccess: "내용이 클립보드에 복사되었습니다",
              copyError: "복사 실패",
              loadError: "시스템 hosts 파일 로드 실패",
              rowCopySuccess: "클립보드에 복사되었습니다",
              rowCopyError: "복사 실패",
            },
            // 新增翻译条目
            groupEnabled: 'Group "{{name}}" enabled',
            groupDisabled: 'Group "{{name}}" disabled',
            toggleGroupError: "Failed to toggle group status",
            groupDeleted: 'Group "{{name}}" deleted',
            deleteGroupError: "Failed to delete group",
            applySuccess: "Hosts configuration applied to system",
            applyError:
              "Failed to apply hosts configuration, please check permissions",
            exportSuccess: 'Group "{{name}}" exported',
            exportError: "Failed to export group configuration",
            statusLocal: "Local",
            statusSynced: "Synced",
            statusPending: "Pending",
            statusConflict: "Conflict",
            systemLabel: "System",
            version: "Version",
            createdAt: "Created",
            updatedAt: "Updated",
            viewContent: "View Content",
            lines: "lines",
            emptyContent: "(Empty)",
            confirmDeleteTitle: "그룹 삭제 확인",
            confirmDeleteMessage:
              '그룹 "{{name}}"을(를) 삭제하시겠습니까？\n\n⚠️ 경고: 이 작업으로 다음이 영구적으로 삭제됩니다：\n• 이 그룹의 모든 호스트 구성\n• 완전한 버전 기록\n• 모든 관련 데이터\n\n이 작업은 되돌릴 수 없습니다.',
            readSystemHostsError: "Failed to read system hosts",
            nameRequired: "Please enter group name",
            updateSuccess: 'Group "{{name}}" updated',
            createSuccess: 'Group "{{name}}" created',
            updateError: "Update failed",
            createError: "Create failed",
            fullscreenEdit: "Fullscreen Edit",
            newGroup: "New Group",
            exitFullscreen: "Exit Fullscreen",
            saving: "Saving...",
            totalEntries: "Total {{count}} entries",
            enabledEntries: "Enabled {{count}} entries",
            contentPlaceholder:
              "127.0.0.1 localhost\n192.168.1.100 api.example.com # Development environment",
            addEntry: "Add Entry",
            optionalComment: "Optional comment",
            noEntries: "No hosts entries",
            addFirstEntry: "Add First Entry",
            back: "Back",
            basicInfo: "Basic Information",
            namePlaceholder: "Enter group name",
            enableGroup: "Enable Group",
            descriptionPlaceholder: "Enter group description (optional)",
            hostsConfig: "Hosts Configuration",
            groupInfo: "Group Information",
            syncStatus: "Sync Status",
          },
          settings: {
            title: "설정",
            description: "애플리케이션 기본 설정을 사용자 정의하세요",
            autoSaved: "자동 저장",
            theme: {
              title: "테마",
              description: "선호하는 테마를 선택하세요",
              light: "라이트",
              dark: "다크",
              system: "시스템",
              currentTheme: "현재 테마: {{theme}}",
            },
            language: {
              title: "언어",
              description: "선호하는 언어를 선택하세요",
              currentLanguage: "현재 언어: {{language}}",
            },
            about: {
              title: "정보",
              version: "버전",
              description: "Host Genius는 강력한 hosts 파일 관리 도구입니다",
            },
            general: {
              title: "일반",
              description: "일반 애플리케이션 설정",
            },
            dataManagement: {
              title: "데이터 관리",
              description: "애플리케이션 데이터 및 백업 관리",
              openDataDirectory: "데이터 디렉토리 열기",
              clearCache: "캐시 지우기",
              comingSoon: "(곧 출시)",
              warning:
                "경고: 데이터 디렉토리의 파일이나 폴더를 삭제하지 마세요. 데이터 손실이 발생할 수 있습니다.",
            },
          },
        },
      },
    },
  });
};

// 导出初始化promise而不是直接的i18n实例
export const i18nInstance = initializeI18n();

export default i18n;
