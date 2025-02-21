export const tourSteps = {
    home: [
        {
            popover: {
                title: '欢迎使用产品引导',
                description: '您可以选择跳过引导，或随时通过页面中的"查看引导"按钮重新开始。<br/>提示：使用左右方向键可切换步骤',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#TencentCloudServiceInitialization',
            popover: {
                title: '腾讯云服务初始化',
                description: '请先完成腾讯云服务配置：<br/>- 访问 <a href="https://console.cloud.tencent.com/tcr/repository" target="_blank">腾讯云控制台</a><br/>- 完成以下操作：<br/> 1. 开通容器镜像服务<br/> 2. 获取API访问密钥',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#GitHub配置',
            popover: {
                title: 'GitHub 私有仓库配置',
                description: '在此创建私有 GitHub 仓库，用于：<br/>- 存储 CI/CD 构建工作流<br/>- 中转 Docker Hub 镜像至腾讯云镜像仓库',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#命名空间',
            popover: {
                title: '命名空间管理',
                description: '在此创建新的命名空间，每个账户最多可创建 10 个命名空间',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#镜像仓库',
            popover: {
                title: '镜像仓库管理',
                description: '在此集中管理所有镜像仓库，支持以下核心功能：<br/>- 镜像管理：创建、查看、删除镜像<br/>- 标签管理：查看、删除标签，复制镜像地址',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#构建日志',
            popover: {
                title: '构建日志监控中心',
                description: '实时监控镜像构建全流程，支持：<br/>- 跳转GitHub查看详细日志<br/> - 构建进度实时追踪<br/> - 构建结果实时更新',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#配额信息',
            popover: {
                title: '资源配额监控中心',
                description: '全面掌握腾讯云资源使用情况：<br/>- 实时监控资源消耗<br/>- 查看各项配额上限<br/>- 支持命名空间、镜像仓库、镜像标签等多维度统计',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#create-image-btn',
            popover: {
                title: '创建镜像',
                description: '点击这里创建一个新的镜像',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#search-image',
            popover: {
                title: '搜索镜像',
                description: '输入关键字可搜索镜像名称',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#tag-list',
            popover: {
                title: '查看标签',
                description: '点击链接可管理镜像标签，支持以下功能：<br/>- 一键复制镜像地址<br/>- 查看镜像所属所有标签详情<br/>- 快速搜索定位标签<br/>- 删除标签（支持批量操作）',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#tag-count',
            popover: {
                title: '标签统计',
                description: '实时显示当前镜像仓库的标签数量，帮助您了解资源使用情况',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#access-level',
            popover: {
                title: '镜像访问权限',
                description: '显示镜像的拉取控制级别：<br/>- 私有：仅授权用户可拉取<br/>- 公有：所有用户均可拉取',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#repo-actions',
            popover: {
                title: '镜像操作栏',
                description: '支持：<br/>- 查看镜像所属标签详情<br/>- 添加新版本标签<br/>- 调整拉取权限级别<br/>- 删除镜像仓库',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"]',
            popover: {
                title: '查看标签',
                description: '点击可管理镜像标签，支持以下功能：<br/>- 一键复制镜像地址<br/>- 查看镜像所属所有标签详情<br/>- 快速搜索定位标签<br/>- 删除标签（支持批量操作）',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-600"]',
            popover: {
                title: '新增标签',
                description: '点击可创建新版本标签，支持将Docker Hub镜像地址转换为腾讯云镜像地址',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[class="text-sm rounded px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"]',
            popover: {
                title: '拉取级别切换',
                description: '点击可切换镜像的拉取控制级别，包括：私有、公有',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[class~="group"][class~="relative"][class~="p-1"][class~="hover:bg-gray-100"][class~="rounded"][class~="dark:hover:bg-gray-700"]',
            popover: {
                title: '删除镜像',
                description: '点击此处可删除镜像，操作不可恢复',
                side: 'bottom',
                align: 'start'
            }
        }
    ],
    'workflow-logs': [
        {
            element: '#workflow-link',
            popover: {
                title: '查看详细构建日志',
                description: '点击此列将跳转至GitHub Actions页面，查看完整的构建日志信息',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#workflow-content',
            popover: {
                title: '镜像信息',
                description: '显示当前构建任务对应的Docker Hub镜像名称',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#workflow-status',
            popover: {
                title: '构建状态追踪',
                description: '实时监控CI/CD流水线状态，包括：排队等待、构建进行中、构建完成等阶段',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#workflow-result',
            popover: {
                title: '构建任务结果',
                description: '显示当前构建任务的最终执行结果，成功或失败状态一目了然',
                side: 'bottom',
                align: 'start'
            }
        }
    ],
    namespaces: [
        {
            element: '#create-namespace-btn',
            popover: {
                title: '新建命名空间',
                description: '创建独立的镜像管理空间，便于分类和权限控制',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#repository-count',
            popover: {
                title: '镜像仓库统计',
                description: '实时显示当前命名空间内的镜像仓库数量，掌握资源分布',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#del-namespace',
            popover: {
                title: '移除命名空间',
                description: '永久删除命名空间，操作不可恢复',
                side: 'left',
                align: 'start'
            }
        }
    ],
    'github-config': [
        {
            element: '#repo-status',
            popover: {
                title: 'GitHub Repo 配置',
                description: '显示 GitHub 私有仓库的状态，这个仓库用于存储 CI/CD 构建工作流，中转 Docker Hub 镜像至腾讯云镜像仓库',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#workflow-status',
            popover: {
                title: 'GitHub Actions 工作流',
                description: '显示 GitHub Actions 工作流的配置内容',
                side: 'right',
                align: 'start'
            }
        }
    ],
    quota: [
        {
            element: '#repoType',
            popover: {
                title: '资源类型概览',
                description: '展示命名空间、仓库和标签的数量信息',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#quota',
            popover: {
                title: '配额详情',
                description: '显示当前账号已创建的资源数量及可使用的总数量',
                side: 'bottom',
                align: 'start'
            }
        }
    ]
};

export const defaultOptions = {
    animate: true,
    showProgress: true,
    showButtons: ['close', 'next', 'previous'],
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    stagePadding: 5,
    popoverClass: 'driverjs-theme',
    popoverOffset: 15,
    prevBtnText: '上一步',
    nextBtnText: '下一步',
    doneBtnText: '完成',
    closeBtnText: '关闭'
}; 