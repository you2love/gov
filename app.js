// 行政层级配置
const ADMIN_LEVELS = {
    central: { name: '国家级（中央）', color: '#667eea', order: 0 },
    province: { name: '省级政府', color: '#764ba2', order: 1 },
    municipal: { name: '市级政府', color: '#f093fb', order: 2 },
    district: { name: '区县级政府', color: '#4facfe', order: 3 },
    township: { name: '街道/乡镇', color: '#43e97b', order: 4 }
};

// 动态加载导航栏
async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    try {
        // 获取当前页面的深度来确定正确的路径
        const pathname = window.location.pathname;
        let navPath, prefix;
        
        if (pathname.includes('/gov-pages/') || pathname.includes('/govjiang-shengt-pages/')) {
            // 子页面在gov-pages或类似目录
            navPath = '../nav-sidebar.html';
            prefix = ''; // 子页面使用相对路径
        } else {
            // 根目录页面
            navPath = 'nav-sidebar.html';
            prefix = 'gov-pages/'; // 根页面需要添加gov-pages前缀
        }
        
        const response = await fetch(navPath);
        if (!response.ok) throw new Error('Failed to load navigation');
        
        let html = await response.text();
        
        // 如果是根目录页面，添加gov-pages/前缀到所有链接
        if (prefix) {
            html = html.replace(/href="(?!http|https|#|mailto)([^"]+)"/g, (match, p1) => {
                // 跳过已包含gov-pages的链接、../链接、#锚点和index.html
                if (p1.startsWith('gov-pages/') || p1.startsWith('../') || 
                    p1.startsWith('#') || p1 === 'index.html' || p1.includes('#')) {
                    return match;
                }
                return `href="${prefix}${p1}"`;
            });
        }
        
        container.innerHTML = html;
        
        // 初始化树形导航
        setupTreeNavigation();
        
        // 设置移动端菜单
        setupMobileMenu();
    } catch (error) {
        console.error('Error loading navigation:', error);
        // 如果加载失败，使用内联导航（备用）
        container.innerHTML = getInlineNavigation();
        setupTreeNavigation();
        setupMobileMenu();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载导航栏
    await loadSidebar();
    
    // 延迟确保导航栏已渲染
    setTimeout(() => {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (mainContent && sidebar) {
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }, 100);
    
    if (Object.keys(governmentData).length > 0) {
        renderGovernmentOrganizations();
    } else {
        showError('政府机构数据未加载，请刷新页面重试。');
    }
    setupEventListeners();
});

// 设置树形导航功能
function setupTreeNavigation() {
    const treeHeaders = document.querySelectorAll('.tree-node-header');

    treeHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();

            // 切换激活状态
            const isActive = this.classList.contains('active');
            // 移除所有同级节点的激活状态
            const parent = this.parentElement;
            const siblings = parent.parentElement.querySelectorAll(':scope > li > .tree-node-header');
            siblings.forEach(sib => sib.classList.remove('active'));

            if (!isActive) {
                this.classList.add('active');
            }

            // 如果有子节点，切换展开/收起
            const toggle = this.querySelector('.tree-toggle');
            if (toggle && !toggle.classList.contains('hidden')) {
                const children = this.nextElementSibling;
                if (children && children.classList.contains('tree-children')) {
                    const isExpanded = children.classList.contains('expanded');
                    if (isExpanded) {
                        children.classList.remove('expanded');
                        toggle.classList.remove('rotated');
                    } else {
                        children.classList.add('expanded');
                        toggle.classList.add('rotated');
                    }
                }
            }
        });
    });

    // 默认展开第一层（省级）
    const firstLevelNodes = document.querySelectorAll('.tree-root > .tree-node > .tree-node-header');
    firstLevelNodes.forEach(node => {
        const toggle = node.querySelector('.tree-toggle');
        const children = node.nextElementSibling;
        if (children && children.classList.contains('tree-children')) {
            children.classList.add('expanded');
            toggle.classList.add('rotated');
        }
    });
}

// 设置移动端菜单切换功能
function setupMobileMenu() {
    // 创建菜单切换按钮
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.setAttribute('aria-label', '切换菜单');
    document.body.appendChild(menuToggle);

    // 点击切换菜单
    menuToggle.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });

    // 点击内容区域关闭菜单
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// 渲染政府机构卡片
function renderGovernmentOrganizations() {
    renderOrganizationsByLevel('central', 'central-orgs');
    renderOrganizationsByLevel('province', 'provincial-orgs');
    renderOrganizationsByLevel('municipal', 'municipal-orgs');
    renderOrganizationsByLevel('district', 'district-orgs');
    renderOrganizationsByLevel('township', 'township-orgs');
}

// 根据层级渲染机构
function renderOrganizationsByLevel(level, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !governmentData[level]) {
        return;
    }

    const organizations = governmentData[level];
    let html = '';

    organizations.forEach(org => {
        html += createOrganizationCard(org, level);
    });

    container.innerHTML = html;
}

// 创建机构卡片HTML
function createOrganizationCard(org, level) {
    const levelInfo = ADMIN_LEVELS[level] || { name: '未知层级', color: '#666' };
    const levelColor = levelInfo.color;

    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card org-card" data-org-id="${org.id}">
                <div class="card-header" style="background: linear-gradient(135deg, ${levelColor}, ${adjustColor(levelColor, -30)});">
                    <span class="badge bg-light text-dark me-2">${levelInfo.name}</span>
                    ${org.shortName || ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${org.name}</h5>
                    <p class="card-text">${org.description}</p>
                    <div class="mb-2">
                        <span class="badge bg-info">
                            <i class="bi bi-building"></i> ${org.category || ''}
                        </span>
                        <span class="badge bg-secondary">
                            <i class="bi bi-calendar"></i> ${org.established || ''}
                        </span>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-globe"></i> ${org.website || ''}
                    </small>
                </div>
                <div class="card-footer bg-white">
                    <button class="btn btn-primary btn-sm w-100" onclick="showOrganizationDetail('${org.id}')">
                        <i class="bi bi-info-circle"></i> 查看详情
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 显示机构详情
function showOrganizationDetail(orgId) {
    const org = findOrganizationById(orgId);
    if (!org) {
        return;
    }

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = `
        <span class="badge bg-light text-dark me-2">${org.level}</span>
        ${org.name}
    `;

    modalBody.innerHTML = `
        <div class="detail-section">
            <h6><i class="bi bi-building"></i> 基本信息</h6>
            <p><strong>简称:</strong> ${org.shortName}</p>
            <p><strong>层级:</strong> ${org.level}</p>
            <p><strong>类别:</strong> ${org.category}</p>
            <p><strong>成立时间:</strong> ${org.established}</p>
            <p><strong>官方网站:</strong> <a href="https://${org.website}" target="_blank">${org.website}</a></p>
            <p><strong>机构简介:</strong> ${org.description}</p>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-person-badge"></i> 人员来源</h6>
            <p>${org.personnelSource}</p>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-arrow-up-circle"></i> 人员升迁</h6>
            <p>${org.personnelPromotion}</p>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-cash-coin"></i> 资金来源</h6>
            <p>${org.fundingSource}</p>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-clipboard-check"></i> 负责内容</h6>
            <ul>
                ${org.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-people"></i> 公众理解</h6>
            <p>${org.publicUnderstanding}</p>
        </div>

        <div class="detail-section">
            <h6><i class="bi bi-diagram-3"></i> 下属机构</h6>
            <p>该单位共有 <strong>${org.subordinates.length}</strong> 个下属机构:</p>
            <div class="row">
                ${org.subordinates.map(sub => `
                    <div class="col-md-6 col-lg-4 mb-2">
                        <span class="badge bg-secondary w-100">${sub}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// 根据ID查找机构
function findOrganizationById(orgId) {
    for (const level in governmentData) {
        const org = governmentData[level].find(o => o.id === orgId);
        if (org) {
            return org;
        }
    }
    return null;
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索功能
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = document.getElementById('searchInput').value.trim();
            if (searchTerm) {
                searchOrganizations(searchTerm);
            }
        });
    }

    // 导航栏平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 搜索输入框实时搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                if (searchTerm.length >= 2) {
                    searchOrganizations(searchTerm);
                } else if (searchTerm.length === 0) {
                    renderGovernmentOrganizations();
                }
            }, 300);
        });
    }
}

// 搜索政府机构
function searchOrganizations(searchTerm) {
    const term = searchTerm.toLowerCase();
    const results = [];

    // 在所有层级中搜索
    for (const level in governmentData) {
        governmentData[level].forEach(org => {
            if (org.name.toLowerCase().includes(term) ||
                org.shortName.toLowerCase().includes(term) ||
                org.description.toLowerCase().includes(term) ||
                org.category.toLowerCase().includes(term)) {
                results.push({
                    ...org,
                    level: level
                });
            }
        });
    }

    // 显示搜索结果
    displaySearchResults(results, searchTerm);
}

// 工具函数：调整颜色亮度
function adjustColor(color, amount) {
    return color;
}

// 显示搜索结果
function displaySearchResults(results, searchTerm) {
    const levels = ['central', 'province', 'municipal', 'district', 'township'];
    const containerIds = ['central-orgs', 'provincial-orgs', 'municipal-orgs', 'district-orgs', 'township-orgs'];

    // 清空所有容器
    containerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
        }
    });

    // 如果没有结果
    if (results.length === 0) {
        const nationalContainer = document.getElementById('national-orgs');
        if (nationalContainer) {
            nationalContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        未找到与 "<strong>${searchTerm}</strong>" 相关的政府机构。请尝试其他关键词。
                    </div>
                </div>
            `;
        }
        return;
    }

    // 按层级分组显示结果
    const groupedResults = {
        central: [],
        province: [],
        municipal: [],
        district: [],
        township: []
    };

    results.forEach(result => {
        if (groupedResults[result.level]) {
            groupedResults[result.level].push(result);
        }
    });

    // 渲染每个层级的结果
    levels.forEach((level, index) => {
        const container = document.getElementById(containerIds[index]);
        if (container && groupedResults[level].length > 0) {
            let html = '';
            groupedResults[level].forEach(org => {
                html += createOrganizationCard(org, level);
            });
            container.innerHTML = html;
        }
    });

    // 显示搜索结果统计
    const nationalContainer = document.getElementById('national-orgs');
    if (nationalContainer && results.length > 0) {
        const resultSummary = `
            <div class="col-12 mb-4">
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i>
                    找到 <strong>${results.length}</strong> 个与 "<strong>${searchTerm}</strong>" 相关的政府机构
                </div>
            </div>
        `;
        nationalContainer.innerHTML = resultSummary + nationalContainer.innerHTML;
    }
}

// 显示错误信息
function showError(message) {
    const containerIds = ['central-orgs', 'provincial-orgs', 'municipal-orgs', 'district-orgs', 'township-orgs'];
    containerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        ${message}
                    </div>
                </div>
            `;
        }
    });
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 工具函数：截断文本
function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

// 导出功能（可选）
function exportData() {
    const dataStr = JSON.stringify(governmentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'government-organizations.json';
    link.click();
    URL.revokeObjectURL(url);
}

// 打印功能
function printPage() {
    window.print();
}