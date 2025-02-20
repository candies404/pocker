export const tourSteps = {
    home: [
        {
            popover: {
                title: '欢迎使用',
                description: '- 可跳过引导，也可以在每个页面点击“查看引导”重新查看。<br/>- 注：可左右键切换',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            popover: {
                title: '必选第一步：初始化腾讯云',
                description: '- 点击-><a href="https://console.cloud.tencent.com/tcr/repository" target="_blank">腾讯云</a><- 跳转<br/>- 主要动作：<br/> 1. 开通容器镜像服务 <br/> 2. 获取API密钥',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#GitHub配置',
            popover: {
                title: '必选第二步：GitHub配置',
                description: '点击这里去创建一个新的GitHub私有仓库',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#命名空间',
            popover: {
                title: '必选第三步：创建命名空间',
                description: '点击这里去创建一个命名空间，最多创建10个',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#自动清理策略',
            popover: {
                title: '可选：配置自动清理策略',
                description: '点击这里去配置自动清理策略',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#镜像仓库',
            popover: {
                title: '功能介绍：镜像列表',
                description: '点击这里可管理镜像和标签',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#构建日志',
            popover: {
                title: '功能介绍：构建日志列表',
                description: '点击这里可查看构建日志',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '#配额信息',
            popover: {
                title: '功能介绍：查看配额信息',
                description: '点击这里可查看腾讯云送的配额信息',
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
            element: '[class="hover:underline focus:outline-none"]',
            popover: {
                title: '查看标签',
                description: '点击这里可查看标签列表，可删除标签，可复制地址',
                side: 'bottom',
                align: 'start'
            }
        }
    ],
    namespaces: [
        {
            element: '#create-namespace-btn',
            popover: {
                title: '创建命名空间',
                description: '点击这里创建一个新的命名空间',
                position: 'bottom'
            }
        }
    ],
    lifecycle: [
        {
            element: '#set-policy-btn',
            popover: {
                title: '设置清理策略',
                description: '设置自动清理策略，管理镜像生命周期',
                position: 'bottom'
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