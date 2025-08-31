// 配置：笔记目录
const NOTES_DIR = 'paper-notes/notes/';

// 本地存储键
const UNCATEGORIZED_KEY = 'uncatLabel';
const CATEGORY_MAP_KEY = 'categoryMap'; // { 'path/to/file.md': '新分类' }
const HIDDEN_KEY = 'hiddenNotes'; // [ 'path/to/file.md' ]

// 默认"未分类"名称
function getUncatLabel() {
  return localStorage.getItem(UNCATEGORIZED_KEY) || '未分类';
}

function setUncatLabel(name) {
  localStorage.setItem(UNCATEGORIZED_KEY, name || '未分类');
}

// 读取/保存单文件分类覆盖
function getCategoryMap() {
  try { return JSON.parse(localStorage.getItem(CATEGORY_MAP_KEY) || '{}'); } catch { return {}; }
}
function setCategoryFor(filePath, category) {
  const map = getCategoryMap();
  if (category) map[filePath] = category; else delete map[filePath];
  localStorage.setItem(CATEGORY_MAP_KEY, JSON.stringify(map));
}

// 隐藏/删除（逻辑）
function getHiddenSet() {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')); } catch { return new Set(); }
}
function saveHiddenSet(set) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(set)));
}
function isHidden(filePath) {
  return getHiddenSet().has(filePath);
}
function hideFile(filePath) {
  const s = getHiddenSet();
  s.add(filePath);
  saveHiddenSet(s);
}
function unhideFile(filePath) {
  const s = getHiddenSet();
  if (s.has(filePath)) { s.delete(filePath); saveHiddenSet(s); }
}

// 全局状态
let papers = [];
let currentPaper = null;
let lastFetchError = null;

function updateStats() {
  const totalPapersEl = document.getElementById('totalPapers');
  const totalCategoriesEl = document.getElementById('totalCategories');
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (totalPapersEl) totalPapersEl.textContent = String(papers.length || 0);
  if (totalCategoriesEl) {
    const cats = new Set(papers.map(p => p.category));
    totalCategoriesEl.textContent = String(cats.size || 0);
  }
  if (lastUpdateEl) {
    const now = new Date();
    const fmt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    lastUpdateEl.textContent = fmt;
  }
}

// 简单的分类规则：优先 Front Matter、用户映射、子目录、关键词
function categorize(filePath, meta) {
  const name = (filePath || '').toLowerCase();
  const titleText = (meta?.title || '').toLowerCase();
  // 1) YAML front matter 指定
  if (meta?.category) return meta.category;
  // 2) 用户手动映射
  const map = getCategoryMap();
  if (map[filePath]) return map[filePath];
  // 3) 子目录作为分类
  if (name.includes('/')) {
    const firstDir = name.split('/')[0];
    if (firstDir) return firstDir;
  }
  // 4) 关键词归类
  if (name.includes('ego') || titleText.includes('ego') || titleText.includes('planner')) return '规划/Planner';
  if (name.includes('faster') || titleText.includes('safe')) return 'FASTER/安全规划';
  // 5) 默认
  return getUncatLabel();
}

// 从 markdown 文本中提取标题（第一行 # 标题）与 YAML Front Matter（title/category），并估算字数
function parseFrontMatter(mdText) {
  let title = '未命名';
  let category = undefined;

  // YAML front matter: --- ... --- 位于开头
  if (/^\s*---[\r\n]/.test(mdText)) {
    const m = mdText.match(/^\s*---[\r\n]([\s\S]*?)[\r\n]---/);
    if (m) {
      const yaml = m[1];
      const t = yaml.match(/\btitle\s*:\s*(.+)/i);
      const c = yaml.match(/\bcategory\s*:\s*(.+)/i);
      if (t) title = t[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      if (c) category = c[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
  }

  // 若未从 YAML 解析到标题，则找第一个 # 标题
  if (title === '未命名') {
    const lines = mdText.split(/\r?\n/);
    for (const line of lines) {
      const m = /^\s*#\s+(.+)/.exec(line);
      if (m) { title = m[1].trim(); break; }
    }
  }

  const textOnly = mdText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/---[\s\S]*?---/, '')
    .replace(/[#>*_\-\[\](){}`]/g, ' ');
  const words = textOnly.trim().split(/\s+/).filter(Boolean);
  return { title, wordCount: words.length, category };
}

// 获取目录中的已知文件（本地静态环境无法列目录，使用初始清单+localStorage）
async function getKnownFiles() {
  // 基础默认清单（fallback）
  const defaults = [
    'egoplannerandmore.md',
    'faster-note.md'
  ];
  const extra = JSON.parse(localStorage.getItem('extraNotes') || '[]');
  const hidden = getHiddenSet();

  let discovered = [];

  async function crawl(relDir, depth) {
    if (depth > 5) return; // 保护：最多 5 级目录
    const dir = relDir.replace(/^\.?\/?|\/+/g, (m) => m.includes('/') ? '/' : '');
    const url = NOTES_DIR + (dir ? dir : '');
    const res = await fetch(url + `?t=${Date.now()}`);
    if (!res.ok) return;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    for (const a of anchors) {
      let href = a.getAttribute('href') || '';
      href = href.split('?')[0];
      // 忽略返回上级
      if (href === '../') continue;
      if (/\/$/i.test(href)) {
        // 子目录，递归
        const next = (dir + href).replace(/^\.?\/?/, '');
        await crawl(next, depth + 1);
      } else if (/\.md$/i.test(href)) {
        const file = (dir + href).replace(/^\.?\/?/, '');
        discovered.push(decodeURIComponent(file));
      }
    }
  }

  try {
    // 仅在 http(s) 场景下尝试目录发现
    if (/^https?:/i.test(location.protocol)) {
      await crawl('', 0);
    }
  } catch (_) {
    // 忽略发现失败，回退到默认与本地清单
  }

  // 合并：优先使用自动发现，其次默认清单，再叠加用户新增
  const base = discovered.length ? discovered : defaults;
  const unique = Array.from(new Set([...base, ...extra]));
  return unique.filter(f => !hidden.has(f));
}

// 尝试获取一个markdown文件内容
async function fetchMarkdown(filePath) {
  // 优先按传入路径获取；若 404 且包含子目录，回退尝试仅文件名，兼容“仅做分类映射”的情况
  const tryPaths = [filePath];
  if (filePath.includes('/')) {
    const base = filePath.split('/').pop();
    if (base && base !== filePath) tryPaths.push(base);
  }
  for (const p of tryPaths) {
    const url = NOTES_DIR + p;
    const res = await fetch(url + `?t=${Date.now()}`);
    if (res.ok) return await res.text();
  }
  throw new Error(`HTTP 404`);
}

// 生成与文档中目录链接一致的 slug（兼容中文与英文混排）
function slugifyHeading(text) {
  const s = String(text || '').trim().toLowerCase();
  // 将除 英文数字/连字符/中文外 的字符替换为连字符
  let slug = s.replace(/[^a-z0-9\-\u4e00-\u9fa5]+/g, '-');
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug || 'section';
}

// 为正文中的标题生成（或标准化）id，确保与目录中的 #slug 能匹配
function ensureHeadingIds(container) {
  if (!container) return;
  const used = new Set();
  const heads = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  heads.forEach(h => {
    let id = h.getAttribute('id');
    if (!id || !id.trim()) {
      id = slugifyHeading(h.textContent || '');
    } else {
      id = slugifyHeading(id); // 标准化已有 id
    }
    let unique = id, i = 1;
    while (used.has(unique)) unique = `${id}-${i++}`;
    used.add(unique);
    h.id = unique;
  });
}

// 在内容区域内处理形如 <a href="#..."> 的内部跳转，并在滚动容器内平滑滚动
function bindInContainerAnchorScroll(container) {
  if (!container || container.dataset.anchorBound === '1') return; // 只绑定一次
  container.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const raw = a.getAttribute('href') || '';
    const id = decodeURIComponent(raw.slice(1));
    const esc = (window.CSS && CSS.escape) ? CSS.escape : (s) => s.replace(/(["\\\[\]\.#:>+~*^$|=!\s])/g, '\\$1');
    let target = container.querySelector(`[id="${esc(id)}"]`);
    // 兼容目录中使用原始标题文本作为 hash 的情况：对 hash 做同样的 slug 规则匹配
    if (!target && typeof slugifyHeading === 'function') {
      const slug = slugifyHeading(id);
      target = container.querySelector(`[id="${esc(slug)}"]`);
    }
    if (!target) return; // 交由默认行为
    e.preventDefault();
    const scrollBox = document.querySelector('.content-body');
    if (scrollBox) {
      const top = target.getBoundingClientRect().top - scrollBox.getBoundingClientRect().top + scrollBox.scrollTop - 8;
      scrollBox.scrollTo({ top, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // 更新 hash（不触发页面跳转）
    try { history.replaceState(null, '', '#' + encodeURIComponent(target.id)); } catch (_) {}
  });
  container.dataset.anchorBound = '1';
}

// 构建侧边栏列表
async function buildList() {
  const listEl = document.getElementById('paperList');
  listEl.innerHTML = '';
  const files = await getKnownFiles();

  // 预取信息
  const items = await Promise.all(files.map(async (filePath) => {
    try {
      const md = await fetchMarkdown(filePath);
      const meta = parseFrontMatter(md);
      const category = categorize(filePath, meta);
      return { file: filePath, ...meta, category, ok: true };
    } catch (e) {
      return { file: filePath, title: filePath.split('/').pop().replace(/\.md$/, ''), wordCount: 0, category: getUncatLabel(), ok: false, error: String(e) };
    }
  }));

  // 分类分组
  const groups = {};
  for (const it of items) {
    if (!groups[it.category]) groups[it.category] = [];
    groups[it.category].push(it);
  }

  papers = items;
  updateStats();

  // 渲染
  Object.keys(groups).sort().forEach(cat => {
    const header = document.createElement('li');
    header.innerHTML = `<div class="paper-item category-header" data-category="${cat}" style="cursor:default;opacity:.8">
        <i class="fas fa-folder-open"></i>
        <div>
          <div class="paper-title">${cat}</div>
          <div class="paper-meta">分类</div>
        </div>
        <div class="paper-inline-actions">
          <button class="icon-btn rename-cat-btn" title="重命名分类"><i class="fas fa-pen"></i></button>
        </div>
      </div>`;
    // 设置分类头部为拖拽目标
    const headerDiv = header.querySelector('.paper-item');
    setupDropTarget(headerDiv, cat);

    // 重命名分类（按钮）
    const renameBtn = header.querySelector('.rename-cat-btn');
    const triggerRename = () => {
      const input = prompt('重命名分类', cat);
      if (!input) return;
      const newName = input.trim().replace(/^[/\\]+|[/\\]+$/g, '');
      if (!newName || newName === cat) return;
      if (groups[newName] && newName !== cat) {
        const ok = confirm(`“${newName}” 已存在，是否合并到该分类？`);
        if (!ok) return;
      }
      // 将该分组下所有文件的分类映射改为新名称
      (groups[cat] || []).forEach(it => setCategoryFor(it.file, newName));
      showToast(`已将“${cat}”重命名为“${newName}”`);
      buildList();
    };
    renameBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); triggerRename(); });
    // 双击分类头也可重命名
    headerDiv.addEventListener('dblclick', (e) => { e.preventDefault(); triggerRename(); });

    listEl.appendChild(header);

    groups[cat].forEach(it => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a class="paper-item draggable-paper" data-file="${it.file}" draggable="true">
          <i class="fas fa-file-lines"></i>
          <div>
            <div class="paper-title">${it.title}</div>
            <div class="paper-meta">${it.file} · ${it.wordCount} 词</div>
          </div>
          <div class="paper-inline-actions">
            <button class="icon-btn delete-btn" title="删除"><i class="fas fa-trash"></i></button>
            <i class="fas fa-grip-vertical drag-handle" title="拖动到分类以移动"></i>
          </div>
        </a>`;
      const a = li.querySelector('a');
      // 点击阅读
      a.addEventListener('click', (e) => {
        e.preventDefault();
        loadPaper(it.file);
        setActiveItem(a);
      });
      // 拖拽
      setupDragEvents(a, it.file);
      // 删除
      const delBtn = li.querySelector('.delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        confirmDelete(it.file);
      });

      listEl.appendChild(li);
    });
  });

  // 若当前有搜索关键词，应用过滤
  const searchEl = document.getElementById('searchInput');
  if (searchEl && searchEl.value.trim()) {
    applySearchFilter(searchEl.value.trim());
  }
}

// 删除确认与执行
function confirmDelete(filePath) {
  const ok = confirm(`确定要删除/隐藏该文件吗？\n\n${filePath}\n\n说明：\n- 如为通过“添加新论文”加入的条目，将从列表移除（不影响磁盘文件）。\n- 如为默认或已存在的文件，将在侧边栏中隐藏。\n- 若要真正删除磁盘文件，请在资源管理器中手动删除。`);
  if (!ok) return;
  deleteNote(filePath);
}

function deleteNote(filePath) {
  // 1) 从 extraNotes 中移除（如果存在）
  const extra = JSON.parse(localStorage.getItem('extraNotes') || '[]');
  const idx = extra.indexOf(filePath);
  if (idx !== -1) {
    extra.splice(idx, 1);
    localStorage.setItem('extraNotes', JSON.stringify(extra));
  } else {
    // 2) 对默认或未在 extra 中的文件，做隐藏标记
    hideFile(filePath);
  }
  // 清除分类映射
  setCategoryFor(filePath, null);

  // 如果当前打开的是该文件，清空内容回到欢迎页
  if (currentPaper === filePath) {
    currentPaper = null;
    document.getElementById('paperContent').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'grid';
  }

  showToast(`已从列表移除：${filePath}`);
  buildList();
}

// 设置拖拽事件
function setupDragEvents(element, filePath) {
  element.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', filePath);
    e.dataTransfer.effectAllowed = 'move';
    element.classList.add('dragging');
    // 高亮所有可拖放的分类头部
    document.querySelectorAll('.category-header').forEach(header => {
      header.classList.add('drop-target-available');
    });
  });
  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
    // 移除所有高亮
    document.querySelectorAll('.category-header').forEach(header => {
      header.classList.remove('drop-target-available', 'drop-target-hover');
    });
  });
}

// 设置拖放目标
function setupDropTarget(element, category) {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    element.classList.add('drop-target-hover');
  });
  element.addEventListener('dragleave', () => {
    element.classList.remove('drop-target-hover');
  });
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    const filePath = e.dataTransfer.getData('text/plain');
    element.classList.remove('drop-target-hover');
    if (filePath && filePath !== category) {
      setCategoryFor(filePath, category);
      buildList();
      showToast(`已将 "${filePath}" 移动到 "${category}" 分类`);
    }
  });
}

// 显示提示消息
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: var(--primary); color: white;
    padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000; font-size: 14px; opacity: 0; transform: translateX(100%); transition: all .3s ease;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 100);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function setActiveItem(el) {
  document.querySelectorAll('.paper-item.active').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

// 主题切换
function setupTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const icon = btn.querySelector('i');
  const apply = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (icon) {
      if (theme === 'light') { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
      else { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    }
  };
  const saved = localStorage.getItem('theme') || 'dark';
  apply(saved);
  btn.addEventListener('click', () => {
    const curr = localStorage.getItem('theme') || 'dark';
    apply(curr === 'dark' ? 'light' : 'dark');
  });
}

// 回到顶部
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  const container = document.querySelector('.content-body');
  if (!btn) return;
  const onScroll = () => {
    const top = (container ? container.scrollTop : window.scrollY) || 0;
    btn.style.display = top > 200 ? 'flex' : 'none';
  };
  (container || window).addEventListener('scroll', onScroll);
  onScroll();
  btn.addEventListener('click', () => {
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 全屏
function setupFullscreen() {
  const btn = document.getElementById('fullscreenBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  const apply = () => {
    const isFs = !!document.fullscreenElement;
    if (icon) {
      if (isFs) { icon.classList.remove('fa-expand'); icon.classList.add('fa-compress'); }
      else { icon.classList.remove('fa-compress'); icon.classList.add('fa-expand'); }
    }
  };
  document.addEventListener('fullscreenchange', apply);
  apply();
  btn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { /* ignore */ }
    apply();
  });
}

// 移动端菜单
function setupMobileMenu() {
  const openBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const toggle = () => sidebar.classList.toggle('open');
  openBtn.addEventListener('click', toggle);
  document.getElementById('sidebarToggle').addEventListener('click', toggle);
}

// 刷新
function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await buildList();
  });
}

// 错误重试
function setupRetry() {
  document.getElementById('retryBtn').addEventListener('click', () => {
    if (lastFetchError?.file) loadPaper(lastFetchError.file);
  });
}

// 添加论文（可支持子目录/分类）
function setupAddPaper() {
  const modal = document.getElementById('addPaperModal');
  const openBtns = [document.getElementById('addPaperBtn'), document.getElementById('quickAddBtn')].filter(Boolean);
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancel');
  const confirmBtn = document.getElementById('modalConfirm');

  const open = () => modal.classList.add('show');
  const close = () => modal.classList.remove('show');

  openBtns.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);

  confirmBtn.addEventListener('click', () => {
    const rawName = document.getElementById('paperFileName').value.trim();
    const dirOrCat = (document.getElementById('paperCategoryInput')?.value || '').trim().replace(/^[/\\]+|[/\\]+$/g, '');
    const title = document.getElementById('paperTitleInput').value.trim();
    if (!rawName) { alert('请输入文件名'); return; }

    // 文件路径：支持用户在“文件名”中直接写相对路径（用于真实子目录）；不再将分类名拼接到路径
    let path = rawName.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    if (!/\.md$/i.test(path)) path += '.md';

    // 将文件加入本地清单；实际文件仍需在 notes 目录中创建（可在子目录中）
    const extra = JSON.parse(localStorage.getItem('extraNotes') || '[]');
    if (!extra.includes(path)) {
      extra.push(path);
      localStorage.setItem('extraNotes', JSON.stringify(extra));
    }
    // 若填写了分类，则仅保存为映射（不影响实际文件路径）
    if (dirOrCat) setCategoryFor(path, dirOrCat);

    // 确保不会被隐藏（如果之前隐藏过同名项）
    unhideFile(path);

    close();
    buildList();
    alert('已添加到列表。\n- 若文件在子目录，请在“文件名”中写相对路径（例如 sub/DRL-RVO.md）。\n- “分类/目录（可选）”仅作为分组映射，不会改变实际文件位置。\n- 请在 paper-notes/notes 下创建对应的 .md 文件后刷新。');
  });
}

// 设置“未分类”的名称
function setupSetUncategorized() {
  const btn = document.getElementById('setUncatBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const current = getUncatLabel();
    const name = prompt('请输入新的“未分类”名称：', current);
    if (name && name !== current) {
      setUncatLabel(name);
      buildList();
    }
  });
}

// 浏览所有论文
function setupBrowseAll() {
  const btn = document.getElementById('browseBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelector('.content-body').scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('paperContent').style.display = 'none';
  });
}

// 初始化
window.addEventListener('DOMContentLoaded', async () => {
  setupSearch();
  setupTheme();
  setupBackToTop();
  setupFullscreen();
  setupMobileMenu();
  setupRefresh();
  setupRetry();
  setupAddPaper();
  setupBrowseAll();
  setupSetUncategorized();

  await buildList();
});

// 搜索过滤实现与绑定
function applySearchFilter(query) {
  const q = (query || '').trim().toLowerCase();
  const listEl = document.getElementById('paperList');
  if (!listEl) return;
  const lis = Array.from(listEl.children);
  let currentHeaderLi = null;
  let visibleCountUnderHeader = 0;

  const commitHeaderVisibility = () => {
    if (!currentHeaderLi) return;
    // 当有关键词时且分组下无可见项则隐藏该分组标题
    currentHeaderLi.style.display = (visibleCountUnderHeader > 0 || q === '') ? '' : 'none';
  };

  lis.forEach(li => {
    const header = li.querySelector('.paper-item.category-header');
    if (header) {
      // 先提交上一个分组标题的可见性
      commitHeaderVisibility();
      // 切换到新的分组
      currentHeaderLi = li;
      visibleCountUnderHeader = 0;
      // 默认显示分组标题，具体是否隐藏由后续提交决定
      li.style.display = '';
      return;
    }

    const a = li.querySelector('a.paper-item.draggable-paper');
    if (!a) return;
    const file = (a.getAttribute('data-file') || '').toLowerCase();
    const title = (a.querySelector('.paper-title')?.textContent || '').toLowerCase();
    const meta = (a.querySelector('.paper-meta')?.textContent || '').toLowerCase();
    const matched = q === '' || title.includes(q) || file.includes(q) || meta.includes(q);
    li.style.display = matched ? '' : 'none';
    if (matched) visibleCountUnderHeader++;
  });

  // 提交最后一个分组
  commitHeaderVisibility();
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', () => applySearchFilter(input.value));
}

// 加载并展示论文内容（含 MathJax 排版与目录锚点平滑跳转）
async function loadPaper(filePath) {
  const loading = document.getElementById('loading');
  const err = document.getElementById('errorMessage');
  const errText = document.getElementById('errorText');
  const welcome = document.getElementById('welcomeScreen');
  const content = document.getElementById('paperContent');
  const bodyEl = document.getElementById('paperBody');
  const titleEl = document.getElementById('paperTitle');
  const catEl = document.getElementById('paperCategory');
  const wcEl = document.getElementById('wordCount');
  try {
    lastFetchError = null;
    if (err) err.style.display = 'none';
    if (content) content.style.display = 'none';
    if (welcome) welcome.style.display = 'none';
    if (loading) loading.style.display = 'grid';

    const md = await fetchMarkdown(filePath);
    const meta = parseFrontMatter(md);
    const category = categorize(filePath, meta);

    // 去掉 YAML Front Matter 再渲染
    const cleaned = md.replace(/^\s*---[\r\n]([\s\S]*?)[\r\n]---\s*/, '');
    let html = '';
    try {
      // 在渲染前保护数学，避免被 markdown 语法（如下划线/星号）破坏
      const prep = preprocessMarkdownPreserveMath(cleaned);
      const src = prep.mdWithPlaceholders;
      if (window.marked && typeof window.marked.parse === 'function') html = window.marked.parse(src);
      else if (window.marked && typeof window.marked === 'function') html = window.marked(src);
      else html = `<pre style="white-space:pre-wrap">${src.replace(/[&<>]/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))}</pre>`;
      // 渲染后还原数学占位符，使 MathJax 能正确识别定界符
      html = prep.restoreMath(html);
    } catch {
      html = `<pre style="white-space:pre-wrap">${cleaned.replace(/[&<>]/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s]))}</pre>`;
    }

    // 更新界面与正文
    if (titleEl) titleEl.textContent = meta.title || filePath;
    if (catEl) catEl.textContent = category || getUncatLabel();
    if (wcEl) wcEl.textContent = `${meta.wordCount || 0} 字`;
    if (bodyEl) {
      bodyEl.innerHTML = html;
      // 给标题生成稳定 id，保证与文内 TOC 的 #... 链接匹配
      ensureHeadingIds(bodyEl);
      // 在滚动容器内处理 # 内部链接平滑滚动
      bindInContainerAnchorScroll(bodyEl);
    }

    // 数学公式渲染（MathJax v3）
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function' && bodyEl) {
      try { await window.MathJax.typesetPromise([bodyEl]); } catch (_) {}
    }

    currentPaper = filePath;

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
  } catch (e) {
    lastFetchError = { file: filePath, error: String(e) };
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (welcome) welcome.style.display = 'none';
    if (errText) errText.textContent = `加载失败：${String(e)}`;
    if (err) err.style.display = 'grid';
  }
}

// 保护 MathJax 公式的预处理：在 Markdown 渲染前用占位符替换数学定界符，渲染后再还原
function preprocessMarkdownPreserveMath(md) {
  const CODE_KEY = (i) => `@@CODE${i}@@`;
  const MATH_KEY = (i) => `@@MATH${i}@@`;
  const codeStore = [];
  const mathStore = [];
  let work = String(md || '');

  // 占位代码块与行内代码，避免被误当作数学
  work = work.replace(/```[\s\S]*?```/g, (m) => { const i = codeStore.length; codeStore.push(m); return CODE_KEY(i); });
  work = work.replace(/`[^`]*`/g, (m) => { const i = codeStore.length; codeStore.push(m); return CODE_KEY(i); });

  // 占位常见数学定界符：$$...$$、\[...\]、\(...\) 以及常见的 $...$ 行内
  work = work.replace(/\$\$[\s\S]+?\$\$/g, (m) => { const i = mathStore.length; mathStore.push(m); return MATH_KEY(i); });
  work = work.replace(/\\\[[\s\S]+?\\\]/g, (m) => { const i = mathStore.length; mathStore.push(m); return MATH_KEY(i); });
  work = work.replace(/\\\([\s\S]+?\\\)/g, (m) => { const i = mathStore.length; mathStore.push(m); return MATH_KEY(i); });
  // 谨慎处理 $...$：至少包含两个非空白字符，且不跨行，避免货币符号等误伤
  work = work.replace(/\$([^$\n]*?\S[^$\n]*?)\$/g, (m) => { const i = mathStore.length; mathStore.push(m); return MATH_KEY(i); });

  // 还原代码占位，保证 marked 能正常处理代码
  work = work.replace(/@@CODE(\d+)@@/g, (_, idx) => codeStore[Number(idx)] || '');

  function restoreMath(html) {
    return String(html || '').replace(/@@MATH(\d+)@@/g, (_, idx) => mathStore[Number(idx)] || '');
  }
  return { mdWithPlaceholders: work, restoreMath };
}