// 政府机构数据（从HTML中获取）
let governmentData = window.governmentData || {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (Object.keys(governmentData).length > 0) {
        renderGovernmentOrganizations();
    } else {
        showError('政府机构数据未加载，请刷新页面重试。');
    }
    setupEventListeners();
    setupTreeNavigation();
    setupMobileMenu();
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
    renderOrganizationsByLevel('national', 'national-orgs');
    renderOrganizationsByLevel('provincial', 'provincial-orgs');
    renderOrganizationsByLevel('municipal', 'municipal-orgs');
    renderOrganizationsByLevel('district', 'district-orgs');
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
        html += createOrganizationCard(org);
    });

    container.innerHTML = html;
}

// 创建机构卡片HTML
function createOrganizationCard(org) {
    const levelColors = {
        '国家级': 'bg-primary',
        '省级': 'bg-success',
        '副省级': 'bg-info',
        '区县级': 'bg-warning'
    };

    const levelColor = levelColors[org.level] || 'bg-secondary';

    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card org-card" data-org-id="${org.id}">
                <div class="card-header ${levelColor}">
                    <span class="badge bg-light text-dark me-2">${org.level}</span>
                    ${org.shortName}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${org.name}</h5>
                    <p class="card-text">${org.description}</p>
                    <div class="mb-2">
                        <span class="badge bg-info">
                            <i class="bi bi-building"></i> ${org.category}
                        </span>
                        <span class="badge bg-secondary">
                            <i class="bi bi-calendar"></i> ${org.established}
                        </span>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-globe"></i> ${org.website}
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

// 显示搜索结果
function displaySearchResults(results, searchTerm) {
    const sections = ['national', 'provincial', 'municipal', 'district'];
    const containerIds = ['national-orgs', 'provincial-orgs', 'municipal-orgs', 'district-orgs'];

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
        national: [],
        provincial: [],
        municipal: [],
        district: []
    };

    results.forEach(result => {
        if (groupedResults[result.level]) {
            groupedResults[result.level].push(result);
        }
    });

    // 渲染每个层级的结果
    sections.forEach((section, index) => {
        const container = document.getElementById(containerIds[index]);
        if (container && groupedResults[section].length > 0) {
            let html = '';
            groupedResults[section].forEach(org => {
                html += createOrganizationCard(org);
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
    const sections = ['national-orgs', 'provincial-orgs', 'municipal-orgs', 'district-orgs'];
    sections.forEach(id => {
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