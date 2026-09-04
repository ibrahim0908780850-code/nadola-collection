import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Facebook,
  Heart,
  Instagram,
  LayoutDashboard,
  Menu,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  WalletCards,
  X,
  MessageCircle,
} from "lucide-react";
import { Link } from "wouter";

type Category = "الكل" | "العناية بالبشرة" | "العناية بالجسم" | "المرطبات" | "العروض";
type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "الكل">;
  en: string;
  price: number;
  oldPrice?: number;
  size: string;
  image: string;
  badge?: string;
  stock: number;
  featured?: boolean;
  bestSeller?: boolean;
  description: string;
};
type CartItem = { product: Product; quantity: number };

const images = {
  hero: "/manus-storage/hero_7ec07b4f.jpg",
  skincare: "/manus-storage/skincare_420a1deb.jpg",
  bodycare: "/manus-storage/bodycare_c15caa0d.jpg",
  moisturizer: "/manus-storage/moisturizer_81d5df47.jpg",
  offers: "/manus-storage/offers_eafa7535.jpg",
};

const products: Product[] = [
  { id: 1, name: "مرطب الجسم بزبدة الشيا", en: "Shea Body Cream", category: "العناية بالجسم", price: 28500, size: "250 مل", image: images.bodycare, badge: "الأكثر مبيعاً", stock: 18, featured: true, bestSeller: true, description: "تركيبة كريمية لطيفة للاستخدام اليومي. اسم المنتج والسعر هنا تجريبيان وقابلان للتغيير." },
  { id: 2, name: "كريم العناية اليومية", en: "Daily Care Cream", category: "العناية بالبشرة", price: 24000, size: "100 مل", image: images.skincare, badge: "جديد", stock: 9, featured: true, description: "منتج تجريبي لعرض تفاصيل العناية اليومية دون ادعاءات طبية أو علاجية." },
  { id: 3, name: "لوشن الجسم المخملي", en: "Velvet Body Lotion", category: "العناية بالجسم", price: 31500, oldPrice: 36000, size: "300 مل", image: images.bodycare, badge: "عرض", stock: 7, featured: true, description: "لوشن تجريبي بقوام خفيف ومظهر فاخر للاستخدام ضمن نموذج المتجر." },
  { id: 4, name: "سيروم الإشراقة الناعمة", en: "Soft Glow Serum", category: "العناية بالبشرة", price: 42000, size: "30 مل", image: images.skincare, badge: "جديد", stock: 14, featured: true, description: "سيروم تجريبي لعرض تجربة المنتج. المكونات والفوائد النهائية تُضاف بعد اعتماد بيانات العلامة." },
  { id: 5, name: "كريم الترطيب العميق", en: "Deep Moisture Cream", category: "المرطبات", price: 26500, size: "150 مل", image: images.moisturizer, stock: 21, featured: true, description: "مرطب تجريبي بقوام غني. يرجى اعتماد الوصف النهائي والمكونات من صاحب المتجر." },
  { id: 6, name: "زبدة الجسم الحريرية", en: "Silk Body Butter", category: "العناية بالجسم", price: 35000, size: "200 مل", image: images.bodycare, badge: "الأكثر مبيعاً", stock: 4, featured: true, bestSeller: true, description: "منتج تجريبي مخصص لعرض فئة العناية بالجسم وإدارة المخزون." },
  { id: 7, name: "منظف البشرة اللطيف", en: "Gentle Skin Cleanser", category: "العناية بالبشرة", price: 22000, size: "200 مل", image: images.skincare, stock: 16, featured: true, description: "منظف تجريبي لطيف ضمن كتالوج Nadola النموذجي." },
  { id: 8, name: "مرطب يومي خفيف", en: "Daily Light Moisturizer", category: "المرطبات", price: 29500, oldPrice: 33000, size: "100 مل", image: images.moisturizer, badge: "عرض", stock: 11, featured: true, description: "مرطب تجريبي خفيف. البيانات النهائية قابلة للتحرير من لوحة الإدارة." },
  { id: 9, name: "مجموعة العناية الهادئة", en: "Calm Care Set", category: "العروض", price: 65000, oldPrice: 78000, size: "3 منتجات", image: images.offers, badge: "عرض", stock: 8, bestSeller: true, description: "حزمة تجريبية قابلة للتعديل لتمثيل العروض والباقات." },
  { id: 10, name: "كريم اليدين الناعم", en: "Soft Hand Cream", category: "العناية بالجسم", price: 18500, size: "75 مل", image: images.bodycare, stock: 25, description: "كريم تجريبي للعناية باليدين ضمن قسم الجسم." },
  { id: 11, name: "باقة البداية اليومية", en: "Daily Starter Bundle", category: "العروض", price: 58000, oldPrice: 69000, size: "منتجان", image: images.offers, badge: "عرض", stock: 5, featured: true, description: "باقة تجريبية تُستخدم لعرض فكرة اشترِ أكثر ووفر أكثر." },
  { id: 12, name: "بلسم الجسم الناعم", en: "Soft Body Balm", category: "العناية بالجسم", price: 27000, size: "180 مل", image: images.bodycare, stock: 12, description: "بلسم تجريبي بقوام غني ومظهر فاخر." },
];

const categories = [
  { name: "العناية بالبشرة" as Category, en: "Skincare", image: images.skincare, count: "4 منتجات" },
  { name: "العناية بالجسم" as Category, en: "Body Care", image: images.bodycare, count: "5 منتجات" },
  { name: "المرطبات" as Category, en: "Moisturizers", image: images.moisturizer, count: "2 منتجات" },
  { name: "العروض" as Category, en: "Offers", image: images.offers, count: "2 باقات" },
];

const formatPrice = (value: number) => new Intl.NumberFormat("ar-SD").format(value);
const whatsappNumber = "249000000000"; // Demo setting — replace from Admin Settings before launch.

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label="Nadola Collection">
      <span className="brand-mark__name">NADOLA</span>
      <span className="brand-mark__sub">COLLECTION</span>
    </div>
  );
}

function IconButton({ label, children, onClick, badge }: { label: string; children: React.ReactNode; onClick?: () => void; badge?: number }) {
  return (
    <button className="icon-button" aria-label={label} onClick={onClick}>
      {children}
      {badge ? <span className="icon-button__badge">{badge}</span> : null}
    </button>
  );
}

function WhatsAppButton({ product, quantity = 1, className = "" }: { product?: Product; quantity?: number; className?: string }) {
  const message = product
    ? `السلام عليكم Nadola Collection 🌸%0A%0Aأرغب في طلب:%0Aالمنتج: ${product.name}%0Aالحجم: ${product.size}%0Aالكمية: ${quantity}%0Aالسعر: ${formatPrice(product.price)} SDG%0A%0Aأرجو تأكيد التوفر والتوصيل.`
    : `السلام عليكم Nadola Collection 🌸%0A%0Aأرغب في الاستفسار عن منتجات المتجر والتوصيل.`;
  return (
    <a className={`button button--whatsapp ${className}`} href={`https://wa.me/${whatsappNumber}?text=${message}`} target="_blank" rel="noreferrer">
      <MessageCircle size={17} />
      {product ? "اطلبي عبر واتساب" : "تواصلي معنا عبر واتساب"}
    </a>
  );
}

function ProductCard({ product, onAdd, onOpen }: { product: Product; onAdd: (product: Product) => void; onOpen: (product: Product) => void }) {
  return (
    <article className="product-card">
      <button className="product-card__visual" onClick={() => onOpen(product)} aria-label={`عرض ${product.name}`}>
        {product.badge ? <span className={`product-badge ${product.badge === "عرض" ? "product-badge--sale" : ""}`}>{product.badge}</span> : null}
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="product-card__quick">عرض التفاصيل <ArrowUpLeft size={15} /></span>
      </button>
      <div className="product-card__body">
        <div className="product-card__meta"><span>{product.category}</span><span className="rating"><Star size={12} fill="currentColor" /> 4.9</span></div>
        <button className="product-card__title" onClick={() => onOpen(product)}>{product.name}</button>
        <div className="product-card__footer">
          <div><strong>{formatPrice(product.price)} <small>SDG</small></strong>{product.oldPrice ? <del>{formatPrice(product.oldPrice)} SDG</del> : null}</div>
          <span className={product.stock <= 5 ? "stock stock--low" : "stock"}>{product.stock <= 5 ? "متبقي كمية محدودة" : "متوفر"}</span>
        </div>
        <button className="add-button" onClick={() => onAdd(product)}><Plus size={16} /> أضيفي للسلة</button>
      </div>
    </article>
  );
}

function Header({ cartCount, onCart, onSearch }: { cartCount: number; onCart: () => void; onSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = ["الرئيسية", "المنتجات", "العناية بالبشرة", "العناية بالجسم", "المرطبات", "الأكثر مبيعاً", "العروض"];
  return (
    <header className="site-header">
      <div className="top-note"><Sparkles size={14} /> عناية مختارة بعناية، وتوصيل سهل داخل السودان</div>
      <div className="container header-main">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="فتح القائمة"><Menu size={21} /></button>
        <div className="header-actions">
          <IconButton label="البحث" onClick={onSearch}><Search size={19} /></IconButton>
          <IconButton label="الحساب"><CircleUserRound size={19} /></IconButton>
          <IconButton label="سلة المشتريات" onClick={onCart} badge={cartCount}><ShoppingCart size={19} /></IconButton>
        </div>
        <BrandMark />
        <nav className={`main-nav ${menuOpen ? "main-nav--open" : ""}`}>
          {navItems.map((item, index) => <a key={item} href={index === 0 ? "#home" : `#${item}`}>{item}</a>)}
        </nav>
        <a href="#contact" className="header-contact">تواصل معنا <ArrowLeft size={15} /></a>
      </div>
    </header>
  );
}

function CartDrawer({ items, open, onClose, onChangeQuantity, onRemove }: { items: CartItem[]; open: boolean; onClose: () => void; onChangeQuantity: (id: number, amount: number) => void; onRemove: (id: number) => void }) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const message = items.length
    ? `السلام عليكم Nadola Collection 🌸%0A%0Aأرغب في طلب:%0A${items.map((item, i) => `${i + 1}. ${item.product.name} — ${item.quantity}`).join("%0A")}%0A%0Aالإجمالي: ${formatPrice(total)} SDG%0A%0Aأرجو تأكيد التوفر والتوصيل.`
    : "";
  return (
    <>
      {open ? <button className="drawer-overlay" onClick={onClose} aria-label="إغلاق السلة" /> : null}
      <aside className={`cart-drawer ${open ? "cart-drawer--open" : ""}`} aria-label="سلة المشتريات">
        <div className="drawer-head"><div><span className="eyebrow">NADOLA COLLECTION</span><h2>سلة مشترياتك</h2></div><button className="close-button" onClick={onClose} aria-label="إغلاق"><X size={20} /></button></div>
        {items.length === 0 ? <div className="cart-empty"><ShoppingBag size={35} /><h3>السلة فارغة حالياً</h3><p>أضيفي القطع التي تحبينها، وسنجهز لكِ طلباً سهلاً عبر واتساب.</p><button className="button button--dark" onClick={onClose}>اكتشفي المنتجات</button></div> : <>
          <div className="cart-items">{items.map(({ product, quantity }) => <div className="cart-item" key={product.id}><img src={product.image} alt="" /><div className="cart-item__info"><strong>{product.name}</strong><span>{product.size}</span><b>{formatPrice(product.price)} SDG</b><div className="qty"><button onClick={() => onChangeQuantity(product.id, -1)}><Minus size={13} /></button><span>{quantity}</span><button onClick={() => onChangeQuantity(product.id, 1)}><Plus size={13} /></button></div></div><button className="cart-item__remove" onClick={() => onRemove(product.id)} aria-label="حذف"><Trash2 size={16} /></button></div>)}</div>
          <div className="cart-summary"><div><span>الإجمالي</span><strong>{formatPrice(total)} <small>SDG</small></strong></div><p>سعر تجريبي قابل للتعديل من بيانات المنتجات.</p><a className="button button--whatsapp button--full" href={`https://wa.me/${whatsappNumber}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> إتمام الطلب عبر واتساب</a></div>
        </>}
      </aside>
    </>
  );
}

function ProductModal({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (product: Product, quantity?: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="product-modal"><button className="close-button product-modal__close" onClick={onClose}><X size={20} /></button><div className="product-modal__image"><img src={product.image} alt={product.name} /></div><div className="product-modal__content"><span className="eyebrow">{product.category}</span><h2>{product.name}</h2><p className="product-modal__en">{product.en}</p><div className="product-modal__price"><strong>{formatPrice(product.price)} <small>SDG</small></strong>{product.oldPrice ? <del>{formatPrice(product.oldPrice)} SDG</del> : null}</div><div className="product-modal__facts"><span><Package size={16} /> {product.size}</span><span><Check size={16} /> {product.stock > 0 ? "متوفر" : "غير متوفر"}</span><span><Star size={16} fill="currentColor" /> 4.9 / 5</span></div><p className="product-modal__description">{product.description}</p><div className="quantity-row"><span>الكمية</span><div className="qty qty--large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div></div><div className="product-modal__actions"><button className="button button--dark" onClick={() => { onAdd(product, quantity); onClose(); }}>أضيفي للسلة <ShoppingCart size={17} /></button><WhatsAppButton product={product} quantity={quantity} /></div><p className="demo-note">ملاحظة: المكونات وطريقة الاستخدام والأسعار هنا بيانات تجريبية قابلة للتحرير.</p></div></div></div>;
}

function SearchPanel({ open, onClose, value, onChange, results, onOpen }: { open: boolean; onClose: () => void; value: string; onChange: (value: string) => void; results: Product[]; onOpen: (p: Product) => void }) {
  if (!open) return null;
  return <div className="search-panel"><div className="container search-panel__inner"><div className="search-input-wrap"><Search size={19} /><input autoFocus value={value} onChange={e => onChange(e.target.value)} placeholder="ابحثي عن كريم، مرطب، عناية..." /><button onClick={onClose}><X size={18} /></button></div>{value ? <div className="search-results">{results.length ? results.slice(0, 5).map(product => <button key={product.id} onClick={() => { onOpen(product); onClose(); }}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.category} · {formatPrice(product.price)} SDG</small></span><ChevronLeft size={17} /></button>) : <p>لا توجد نتائج مطابقة، جربي كلمة أخرى.</p>}</div> : <div className="search-hints"><span>الأكثر بحثاً</span><button onClick={() => onChange("مرطب")}>مرطب</button><button onClick={() => onChange("كريم")}>كريم</button><button onClick={() => onChange("العناية بالجسم")}>العناية بالجسم</button></div>}</div></div>;
}

function Home() {
  const [category, setCategory] = useState<Category>("الكل");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter(p => (category === "الكل" || p.category === category) && (!query || `${p.name} ${p.category} ${p.en}`.toLowerCase().includes(query)));
    if (sort === "price-low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "best") return [...list].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [category, search, sort]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addToCart = (product: Product, quantity = 1) => {
    setCart(items => { const found = items.find(item => item.product.id === product.id); return found ? items.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { product, quantity }]; });
    toast.success("تمت إضافة المنتج إلى السلة", { description: product.name });
  };
  const updateQty = (id: number, amount: number) => setCart(items => items.map(item => item.product.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item));
  const removeItem = (id: number) => setCart(items => items.filter(item => item.product.id !== id));
  const openCategory = (value: Category) => { setCategory(value); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); };

  return <div className="storefront" dir="rtl">
    <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onSearch={() => setSearchOpen(true)} />
    <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} value={search} onChange={setSearch} results={filteredProducts} onOpen={setSelectedProduct} />
    <main>
      <section id="home" className="hero-section"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow eyebrow--gold">NADOLA COLLECTION <span>•</span> BEAUTY ESSENTIALS</span><h1>عنايتك ببشرتك<br /><em>تبدأ من Nadola</em></h1><p>اكتشفي مجموعة مختارة من منتجات العناية بالبشرة والجسم والمرطبات لتمنحي بشرتك عناية تستحقها.</p><div className="hero-actions"><button className="button button--dark" onClick={() => openCategory("الكل")}>تسوقي الآن <ArrowLeft size={17} /></button><WhatsAppButton /></div><div className="hero-footnote"><span><Check size={14} /> منتجات مختارة بعناية</span><span><Check size={14} /> طلب سريع عبر واتساب</span></div></div><div className="hero-visual"><img src={images.hero} alt="منتجات Nadola للعناية بالبشرة والجسم" /><div className="hero-visual__label"><span>مختارات العناية</span><strong>كل يوم، بلطف أكثر.</strong></div></div></div></section>
      <section className="marquee"><div className="marquee__track"><span>CARE, CURATED BEAUTIFULLY</span><i>✦</i><span>عناية تستحقها بشرتك</span><i>✦</i><span>CARE, CURATED BEAUTIFULLY</span><i>✦</i><span>عناية تستحقها بشرتك</span></div></section>
      <section className="section categories-section" id="التصنيفات"><div className="container"><div className="section-heading"><div><span className="eyebrow">اكتشفي منتجاتنا</span><h2>روتينك يبدأ من هنا</h2></div><button className="text-link" onClick={() => openCategory("الكل")}>استعرضي كل المنتجات <ArrowLeft size={15} /></button></div><div className="category-grid">{categories.map((cat, i) => <button className={`category-tile category-tile--${i + 1}`} key={cat.name} onClick={() => openCategory(cat.name)}><img src={cat.image} alt="" /><span className="category-tile__shade" /><div><small>{cat.en}</small><strong>{cat.name}</strong><em>{cat.count} <ArrowLeft size={13} /></em></div></button>)}</div></div></section>
      <section className="section products-section" id="products"><div className="container"><div className="section-heading section-heading--stack"><div><span className="eyebrow">NADOLA EDIT</span><h2>منتجات مختارة لكِ</h2><p>بيانات تجريبية لتجربة المتجر — يمكن تعديلها بالكامل من لوحة الإدارة.</p></div><div className="product-tools"><div className="category-pills">{(["الكل", "العناية بالبشرة", "العناية بالجسم", "المرطبات", "العروض"] as Category[]).map(item => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="sort-select"><span>ترتيب:</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">الأحدث</option><option value="best">الأكثر مبيعاً</option><option value="price-low">السعر الأقل</option><option value="price-high">السعر الأعلى</option></select><ChevronDown size={15} /></label></div></div><div className="products-grid">{filteredProducts.map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={setSelectedProduct} />)}</div>{filteredProducts.length === 0 ? <div className="empty-state"><Search size={28} /><h3>لم نجد منتجات مطابقة</h3><button className="button button--dark" onClick={() => { setSearch(""); setCategory("الكل"); }}>عرض كل المنتجات</button></div> : null}</div></section>
      <section className="feature-banner"><div className="container feature-banner__inner"><div><span className="eyebrow eyebrow--gold">THE NADOLA RITUAL</span><h2>تفاصيل صغيرة،<br /><em>إحساس أكبر بالعناية.</em></h2><p>نختار لكِ قطعاً تنسجم مع يومك — من المرطب اليومي إلى لحظات العناية الهادئة.</p><button className="button button--light" onClick={() => openCategory("المرطبات")}>اكتشفي المرطبات <ArrowLeft size={17} /></button></div><div className="feature-banner__ornament"><span>01</span><div className="ornament-line" /><span>04</span></div></div></section>
      <section className="section bestseller-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">MOST LOVED</span><h2>الأكثر مبيعاً</h2></div><button className="text-link" onClick={() => { setSort("best"); openCategory("الكل"); }}>شاهدي المجموعة <ArrowLeft size={15} /></button></div><div className="bestseller-grid"><div className="bestseller-feature"><img src={images.offers} alt="مجموعة عناية" /><div><span className="eyebrow eyebrow--gold">NADOLA SETS</span><h3>لحظات عناية<br /><em>تستحق الاحتفاء.</em></h3><button className="button button--light" onClick={() => openCategory("العروض")}>شاهدي العروض <ArrowLeft size={16} /></button></div></div><div className="mini-products">{products.filter(p => p.bestSeller).slice(0, 3).map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={setSelectedProduct} />)}</div></div></div></section>
      <section className="section guide-section"><div className="container guide-grid"><div className="guide-intro"><span className="eyebrow">دليل العناية</span><h2>نصائح بسيطة<br /><em>لروتين أجمل.</em></h2><p>محتوى توعوي مختصر يساعدك على اختيار المنتجات واستخدامها بلطف، دون ادعاءات طبية أو علاجية.</p><button className="text-link">اكتشفي الدليل <ArrowLeft size={15} /></button></div><div className="guide-list">{["كيف تختارين المرطب المناسب؟", "روتين العناية بالجسم", "كيف تستخدمين كريم الجسم؟", "الفرق بين الكريم واللوشن"].map((title, i) => <button key={title} className="guide-item"><span>0{i + 1}</span><strong>{title}</strong><ArrowLeft size={18} /></button>)}</div></div></section>
      <section className="trust-section"><div className="container trust-grid"><div className="trust-heading"><span className="eyebrow eyebrow--gold">WHY NADOLA?</span><h2>كل ما تحتاجه<br /><em>تجربة أهدأ.</em></h2></div>{[{ icon: Sparkles, title: "منتجات مختارة بعناية", text: "كتالوج هادئ وواضح يساعدك على الاختيار بسهولة." }, { icon: ShoppingBag, title: "تجربة شراء سهلة", text: "من التصفح إلى السلة، خطوات قليلة وواضحة." }, { icon: MessageCircle, title: "طلب سريع عبر واتساب", text: "أرسلي طلبك في رسالة واحدة وتابعي التفاصيل مباشرة." }, { icon: Heart, title: "خدمة عملاء مباشرة", text: "مساحة ترحيبية للاستفسارات قبل وبعد الطلب." }].map(({ icon: Icon, title, text }) => <div className="trust-item" key={title}><Icon size={22} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section className="section instagram-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">@NADOLACOLLECTION</span><h2>تابعينا على Instagram</h2></div><a className="text-link" href="https://instagram.com" target="_blank" rel="noreferrer">تابعينا <Instagram size={16} /></a></div><div className="instagram-grid">{[images.skincare, images.bodycare, images.moisturizer, images.offers, images.hero].map((image, i) => <a href="https://instagram.com" target="_blank" rel="noreferrer" key={`${image}-${i}`}><img src={image} alt="لقطة من منتجات Nadola" loading="lazy" /><span><Instagram size={18} /></span></a>)}</div></div></section>
    </main>
    <footer id="contact" className="site-footer"><div className="container footer-grid"><div><BrandMark /><p>عناية مختارة ببساطة راقية.<br />Nadola Collection — السودان.</p><div className="socials"><a href="https://facebook.com" target="_blank" rel="noreferrer"><Facebook size={17} /></a><a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={17} /></a><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /></a></div></div><div><h3>المتجر</h3><a href="#products">كل المنتجات</a><a href="#التصنيفات">التصنيفات</a><a href="#products">الأكثر مبيعاً</a><a href="#products">العروض</a></div><div><h3>مساعدة</h3><a href="#contact">تواصل معنا</a><a href="#home">سياسة التوصيل</a><a href="#home">الأسئلة الشائعة</a><Link href="/admin">لوحة الإدارة</Link></div><div className="footer-newsletter"><h3>كوني على اطلاع</h3><p>اشتركي لتصلك أحدث المختارات والعروض.</p><div><input placeholder="بريدك الإلكتروني" aria-label="البريد الإلكتروني" /><button onClick={() => toast.success("تم تسجيل بريدك في النموذج التجريبي")}>اشتراك</button></div><small>لن نرسل لكِ إلا ما يهمك.</small></div></div><div className="container footer-bottom"><span>© 2026 Nadola Collection. Demo storefront.</span><span>صُمم بعناية للسوق السوداني <span className="gold-dot">✦</span></span></div></footer>
    <CartDrawer items={cart} open={cartOpen} onClose={() => setCartOpen(false)} onChangeQuantity={updateQty} onRemove={removeItem} />
    <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
  </div>;
}

function Admin() {
  const [active, setActive] = useState("overview");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const lowStock = products.filter(p => p.stock <= 5);
  const nav = [{ id: "overview", label: "نظرة عامة", icon: LayoutDashboard }, { id: "products", label: "المنتجات", icon: Package }, { id: "orders", label: "الطلبات", icon: ShoppingBag }, { id: "customers", label: "العملاء", icon: Users }, { id: "analytics", label: "التحليلات", icon: BarChart3 }, { id: "settings", label: "الإعدادات", icon: Settings }];
  return <div className="admin-app" dir="rtl"><aside className="admin-sidebar"><div className="admin-brand"><BrandMark compact /><span>لوحة الإدارة</span></div><nav>{nav.map(({ id, label, icon: Icon }) => <button className={active === id ? "active" : ""} key={id} onClick={() => setActive(id)}><Icon size={18} />{label}</button>)}</nav><div className="admin-sidebar__bottom"><div className="admin-user"><div className="avatar">ن</div><div><strong>مديرة المتجر</strong><span>مدير النظام</span></div><ChevronLeft size={15} /></div><Link href="/" className="back-store"><ArrowRightIcon /> العودة للمتجر</Link></div></aside><main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">NADOLA COLLECTION / ADMIN</span><h1>{nav.find(item => item.id === active)?.label}</h1></div><div className="admin-topbar__actions"><button className="notification-button"><Bell size={18} /><span /></button><div className="admin-date"><Clock3 size={15} /> 04 سبتمبر 2026</div></div></header>{active === "overview" ? <Overview lowStock={lowStock} /> : active === "products" ? <ProductsPanel /> : active === "orders" ? <OrdersPanel /> : active === "customers" ? <CustomersPanel /> : active === "analytics" ? <AnalyticsPanel /> : <SettingsPanel saved={settingsSaved} onSave={() => { setSettingsSaved(true); toast.success("تم حفظ إعدادات النموذج"); }} />}</main></div>;
}
function ArrowRightIcon() { return <ArrowLeft size={15} />; }
function Overview({ lowStock }: { lowStock: Product[] }) { return <div className="admin-content"><div className="stats-grid">{[{ label: "إجمالي المبيعات", value: "٢٤٨,٥٠٠", unit: "SDG", delta: "+١٨٪", icon: WalletCards }, { label: "إجمالي الطلبات", value: "١٢٨", unit: "طلب", delta: "+١٢٪", icon: ShoppingBag }, { label: "طلبات اليوم", value: "١٤", unit: "طلب جديد", delta: "+٥٪", icon: TrendingUp }, { label: "المنتجات", value: "١٢", unit: "منتج نشط", delta: "٣ منخفضة", icon: Package }].map(({ label, value, unit, delta, icon: Icon }) => <div className="stat-card" key={label}><div className="stat-card__top"><span>{label}</span><span className="stat-icon"><Icon size={17} /></span></div><strong>{value} <small>{unit}</small></strong><div><span className={delta.includes("منخفضة") ? "stat-low" : "stat-up"}>{delta}</span><span>مقارنة بالشهر السابق</span></div></div>)}</div><div className="admin-grid-2"><section className="admin-panel sales-panel"><div className="panel-heading"><div><span className="eyebrow">SALES OVERVIEW</span><h2>نظرة على المبيعات</h2></div><select><option>آخر ٧ أيام</option><option>آخر ٣٠ يوماً</option></select></div><div className="chart"><div className="chart-y"><span>50k</span><span>30k</span><span>10k</span><span>0</span></div><div className="chart-area"><div className="chart-grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-label="رسم بياني للمبيعات"><path d="M0 175 C45 155, 70 163, 105 135 S165 155, 205 125 S260 110, 300 125 S350 145, 390 92 S445 108, 480 70 S540 95, 600 32" fill="none" stroke="#9e7a51" strokeWidth="3" /><path d="M0 175 C45 155, 70 163, 105 135 S165 155, 205 125 S260 110, 300 125 S350 145, 390 92 S445 108, 480 70 S540 95, 600 32 L600 210 L0 210Z" fill="url(#chartFill)" opacity=".35" /><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#c7a77d" /><stop offset="1" stopColor="#fffaf3" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>السبت</span><span>الأحد</span><span>الإثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span></div></div></div></section><section className="admin-panel stock-panel"><div className="panel-heading"><div><span className="eyebrow">INVENTORY</span><h2>مخزون يحتاج انتباه</h2></div><button className="panel-link">عرض الكل <ArrowLeft size={14} /></button></div>{lowStock.map(product => <div className="stock-row" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.size}</span></div><div className="stock-meter"><i style={{ width: `${Math.max(product.stock * 12, 12)}%` }} /></div><b>{product.stock} قطع</b></div>)}<div className="stock-footer"><Check size={15} /> متابعة المخزون محدثة تلقائياً في النموذج</div></section></div><section className="admin-panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">RECENT ORDERS</span><h2>آخر الطلبات</h2></div><button className="panel-link">كل الطلبات <ArrowLeft size={14} /></button></div><OrdersTable compact /></section></div>; }
function OrdersTable({ compact = false }: { compact?: boolean }) { const orders = [{ id: "#ND-1048", name: "سارة محمد", phone: "09•• ••• 321", total: "٦٨,٥٠٠ SDG", status: "تم التواصل", time: "منذ ١٢ دقيقة" }, { id: "#ND-1047", name: "آمنة أحمد", phone: "01•• ••• 654", total: "٣١,٥٠٠ SDG", status: "طلب جديد", time: "منذ ٤٥ دقيقة" }, { id: "#ND-1046", name: "نور الهدى", phone: "09•• ••• 987", total: "١١٠,٠٠٠ SDG", status: "قيد التجهيز", time: "منذ ساعتين" }, { id: "#ND-1045", name: "مريم عثمان", phone: "01•• ••• 147", total: "٢٤,٠٠٠ SDG", status: "تم التسليم", time: "أمس" }]; return <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>المنتجات</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th><th /></tr></thead><tbody>{orders.slice(0, compact ? 4 : orders.length).map(order => <tr key={order.id}><td><strong>{order.id}</strong></td><td><div className="customer-cell"><span className="avatar avatar--small">{order.name.charAt(0)}</span><div><strong>{order.name}</strong><small>{order.phone}</small></div></div></td><td>{order.id === "#ND-1048" ? "مرطبان، سيروم" : "منتج تجريبي × 1"}</td><td><strong>{order.total}</strong></td><td><span className={`order-status status--${order.status}`}>{order.status}</span></td><td>{order.time}</td><td><button className="table-action"><Pencil size={15} /></button></td></tr>)}</tbody></table></div>; }
function ProductsPanel() { return <div className="admin-content"><div className="panel-toolbar"><div><p className="admin-muted">إدارة الكتالوج والمخزون والأسعار</p></div><button className="button button--dark"><Plus size={17} /> إضافة منتج</button></div><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">CATALOG / 12 ITEMS</span><h2>كل المنتجات</h2></div><div className="toolbar-search"><Search size={15} /><input placeholder="ابحثي في المنتجات" /></div></div><div className="product-admin-grid">{products.map(product => <div className="product-admin-card" key={product.id}><img src={product.image} alt="" /><div><span className="eyebrow">{product.category}</span><h3>{product.name}</h3><p>{formatPrice(product.price)} SDG · {product.size}</p><div><span className={product.stock <= 5 ? "stock stock--low" : "stock"}>{product.stock <= 5 ? "مخزون منخفض" : "متوفر"}</span><button><Pencil size={14} /></button></div></div></div>)}</div></section></div>; }
function OrdersPanel() { return <div className="admin-content"><div className="panel-toolbar"><div><p className="admin-muted">متابعة الطلبات الواردة من واتساب</p></div><button className="button button--outline"><ArrowUpLeft size={16} /> تصدير</button></div><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">ORDERS / 128 TOTAL</span><h2>إدارة الطلبات</h2></div><select><option>كل الحالات</option><option>طلب جديد</option><option>تم التسليم</option></select></div><OrdersTable /></section></div>; }
function CustomersPanel() { return <div className="admin-content"><div className="stats-grid stats-grid--three"><div className="stat-card"><div className="stat-card__top"><span>إجمالي العملاء</span><span className="stat-icon"><Users size={17} /></span></div><strong>٨٤٢ <small>عميل</small></strong><div><span className="stat-up">+٢٢٪</span><span>هذا الشهر</span></div></div><div className="stat-card"><div className="stat-card__top"><span>عملاء متكررون</span><span className="stat-icon"><Heart size={17} /></span></div><strong>٦٤ <small>عميل</small></strong><div><span className="stat-up">+١١٪</span><span>هذا الشهر</span></div></div><div className="stat-card"><div className="stat-card__top"><span>متوسط الطلب</span><span className="stat-icon"><WalletCards size={17} /></span></div><strong>٤٢,٣٠٠ <small>SDG</small></strong><div><span className="stat-up">+٨٪</span><span>هذا الشهر</span></div></div></div><section className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">CUSTOMERS / PRIVACY FIRST</span><h2>آخر العملاء</h2></div></div><div className="customer-list">{["سارة محمد", "آمنة أحمد", "نور الهدى", "مريم عثمان", "رنا عبد الله"].map((name, i) => <div className="customer-list__row" key={name}><span className="avatar">{name.charAt(0)}</span><div><strong>{name}</strong><span>{i + 2} طلبات سابقة · {formatPrice((i + 2) * 68500)} SDG</span></div><span className="customer-date">آخر طلب منذ {i + 1} يوم</span><button className="table-action"><ChevronLeft size={15} /></button></div>)}</div></section></div>; }
function AnalyticsPanel() { return <div className="admin-content"><div className="panel-toolbar"><div><p className="admin-muted">مؤشرات أداء بسيطة وأنيقة لاتخاذ قرارات أسرع</p></div><select><option>سبتمبر 2026</option><option>أغسطس 2026</option></select></div><div className="analytics-cards"><div className="analytics-highlight"><span className="eyebrow eyebrow--gold">TOTAL SALES</span><strong>٢٤٨,٥٠٠ <small>SDG</small></strong><p><TrendingUp size={15} /> ١٨٪ أعلى من الشهر السابق</p><div className="bar-rows">{[45, 62, 52, 80, 68, 92, 74].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div><div className="admin-panel"><div className="panel-heading"><div><span className="eyebrow">BEST SELLERS</span><h2>أفضل المنتجات</h2></div></div>{products.filter(p => p.bestSeller || p.featured).slice(0, 4).map((p, i) => <div className="rank-row" key={p.id}><span>0{i + 1}</span><img src={p.image} alt="" /><div><strong>{p.name}</strong><small>{p.category}</small></div><b>{(42 - i * 7)} طلب</b></div>)}</div></div></div>; }
function SettingsPanel({ saved, onSave }: { saved: boolean; onSave: () => void }) { return <div className="admin-content"><div className="panel-toolbar"><div><p className="admin-muted">إعدادات الروابط وبيانات التواصل للنسخة النهائية</p></div>{saved ? <span className="saved-state"><Check size={15} /> تم الحفظ</span> : null}</div><div className="settings-grid"><section className="admin-panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">STORE SETTINGS</span><h2>هوية المتجر</h2></div></div><label>اسم المتجر<input defaultValue="Nadola Collection" /></label><label>وصف مختصر<textarea defaultValue="عناية مختارة ببساطة راقية." /></label><label>رقم واتساب التجريبي<input dir="ltr" defaultValue={whatsappNumber} /><small>استبدليه برقم المتجر الحقيقي قبل الإطلاق.</small></label><button className="button button--dark" onClick={onSave}>حفظ الإعدادات</button></section><section className="admin-panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">SOCIAL LINKS</span><h2>روابط التواصل</h2></div></div><label>Instagram<input dir="ltr" defaultValue="https://instagram.com/nadolacollection" /></label><label>Facebook<input dir="ltr" defaultValue="https://facebook.com/nadolacollection" /></label><label>رسالة الطلب الافتراضية<textarea defaultValue="السلام عليكم Nadola Collection 🌸\nأرغب في طلب:" /></label><div className="settings-note"><Settings size={17} /><span>هذه لوحة تحكم تجريبية. يمكن ربطها لاحقاً بقاعدة البيانات ورفع الصور والصلاحيات.</span></div></section></div></div>; }

export { Admin };
export default Home;
