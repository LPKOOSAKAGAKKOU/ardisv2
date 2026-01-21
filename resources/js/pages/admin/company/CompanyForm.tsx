import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Factory, Globe, Phone, Mail, User, MapPin, Laptop } from 'lucide-react';
import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

interface Props {
    company?: any;
}

export default function CompanyForm({ company }: Props) {
    const isEdit = !!company;

    const { data, setData, post, patch, processing, errors } = useForm({
        name: company?.name || '',
        name_in_japanese: company?.name_in_japanese || '',
        industry: company?.industry || '',
        address: company?.address || '',
        address_in_japanese: company?.address_in_japanese || '',
        prefecture: company?.prefecture || '',
        contact_person: company?.contact_person || '',
        phone: company?.phone || '',
        email: company?.email || '',
        website: company?.website || '',
    });

    const breadcrumbs = [
        { title: 'Data Perusahaan', href: '/admin/companies' },
        { title: isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        isEdit ? patch(`/admin/companies/${company.id}`) : post('/admin/companies');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan'} />
            
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                        <Factory size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}</h1>
                        <p className="text-sm text-muted-foreground">Detail perusahaan penerima (Jisshu Saki) di Jepang.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-sidebar-border shadow-sm">
                    
                    {/* IDENTITAS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">Nama Perusahaan (Alfabet)</label>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Contoh: Tanaka Kensetsu Co., Ltd." className="h-11" />
                            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">Nama (Bahasa Jepang)</label>
                            <Input value={data.name_in_japanese} onChange={e => setData('name_in_japanese', e.target.value)} placeholder="株式会社田中建設" className="h-11 font-japanese" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Sektor Industri</label>
                            <Select 
                                value={data.industry} 
                                onValueChange={v => setData('industry', v)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih Jenis Pekerjaan" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px]">
                                    <SelectGroup>
                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-2">1. 農業関係 - Bidang Pertanian</SelectLabel>
                                        <SelectItem value="耕種農業">Pertanian Tanaman (耕種農業)</SelectItem>
                                        <SelectItem value="畜産農業">Peternakan (畜産農業)</SelectItem>
                                        
                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">2. 漁業関係 - Bidang Perikanan</SelectLabel>
                                        <SelectItem value="漁船漁業">Perikanan Kapal (漁船漁業)</SelectItem>
                                        <SelectItem value="養殖業">Budidaya Perikanan (養殖業)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">3. 建設関係 - Bidang Konstruksi</SelectLabel>
                                        <SelectItem value="さく井">Pengeboran Sumur (さく井)</SelectItem>
                                        <SelectItem value="建築板金">Pelat Logam Bangunan (建築板金)</SelectItem>
                                        <SelectItem value="冷凍空調機器施工">AC & Pendingin (冷凍空調機器施工)</SelectItem>
                                        <SelectItem value="建具製作">Perangkat Bangunan (建具製作)</SelectItem>
                                        <SelectItem value="建築大工">Tukang Kayu (建築大工)</SelectItem>
                                        <SelectItem value="型枠施工">Pekerjaan Bekisting (型枠施工)</SelectItem>
                                        <SelectItem value="鉄筋施工">Pekerjaan Tulangan (鉄筋施工)</SelectItem>
                                        <SelectItem value="とび">Perancah Bangunan (とび)</SelectItem>
                                        <SelectItem value="石材施工">Pekerjaan Batu (石材施工)</SelectItem>
                                        <SelectItem value="タイル張り">Pemasangan Ubin (タイル張り)</SelectItem>
                                        <SelectItem value="かわらぶき">Pemasangan Genteng (かわらぶき)</SelectItem>
                                        <SelectItem value="左官">Plesteran (左官)</SelectItem>
                                        <SelectItem value="配管">Pemasangan Pipa (配管)</SelectItem>
                                        <SelectItem value="熱絶縁施工">Isolasi Panas (熱絶縁施工)</SelectItem>
                                        <SelectItem value="内装仕上げ施工">Interior Finishing (内装仕上げ施工)</SelectItem>
                                        <SelectItem value="サッシ施工">Kusen / Sash (サッシ施工)</SelectItem>
                                        <SelectItem value="防水施工">Waterproofing (防水施工)</SelectItem>
                                        <SelectItem value="コンクリート圧送施工">Pengecoran Beton (コンクリート圧送施工)</SelectItem>
                                        <SelectItem value="ウェルポイント施工">Well Point (ウェルポイント施工)</SelectItem>
                                        <SelectItem value="表装">Wallpaper & Lining (表装)</SelectItem>
                                        <SelectItem value="建設機械施工">Alat Berat (建設機械施工)</SelectItem>
                                        <SelectItem value="畳製作">Pembuatan Tatami (畳製作)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">4. 食品製造関係 - Produksi Makanan</SelectLabel>
                                        <SelectItem value="缶詰巻締">Penyegelan Kaleng (缶詰巻締)</SelectItem>
                                        <SelectItem value="食鳥処理加工業">Pengolahan Unggas (食鳥処理加工業)</SelectItem>
                                        <SelectItem value="加熱性水産加工">Produk Laut Termal (加熱性水産加工)</SelectItem>
                                        <SelectItem value="非加熱性水産加工">Produk Laut Non-Termal (非加熱性水産加工)</SelectItem>
                                        <SelectItem value="水産練り製品製造">Olahan Ikan Giling (水産練り製品製造)</SelectItem>
                                        <SelectItem value="牛豚食肉処理加工業">Daging Sapi & Babi (牛豚食肉処理加工業)</SelectItem>
                                        <SelectItem value="ハム・ソーセージ・ベーコン製造">Ham & Sosis (ハム・ソーセージ・ベーコン製造)</SelectItem>
                                        <SelectItem value="パン製造">Pembuatan Roti (パン製造)</SelectItem>
                                        <SelectItem value="そう菜製造業">Makanan Siap Saji (そう菜製造業)</SelectItem>
                                        <SelectItem value="農産物漬物製造業">Industri Acar (農産物漬物製造業)</SelectItem>
                                        <SelectItem value="医療・福祉施設給食製造">Makanan Medis (医療・福祉施設給食製造)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">5. 繊維・衣服関係 - Tekstil & Pakaian</SelectLabel>
                                        <SelectItem value="紡績運転">Pemintalan (紡績運転)</SelectItem>
                                        <SelectItem value="織布運転">Tenun (織布運転)</SelectItem>
                                        <SelectItem value="染色">Pewarnaan Kain (染色)</SelectItem>
                                        <SelectItem value="ニット製品製造">Barang Rajutan (ニット製品製造)</SelectItem>
                                        <SelectItem value="たて編ニット生地製造">Rajutan Warp (たて編ニット生地製造)</SelectItem>
                                        <SelectItem value="婦人子供服製造">Pakaian Wanita & Anak (婦人子供服製造)</SelectItem>
                                        <SelectItem value="紳士服製造">Pakaian Pria (紳士服製造)</SelectItem>
                                        <SelectItem value="下着類製造">Pakaian Dalam (下着類製造)</SelectItem>
                                        <SelectItem value="寝具製作">Alat Tidur (寝具製作)</SelectItem>
                                        <SelectItem value="カーペット製造">Karpet (カーペット製造)</SelectItem>
                                        <SelectItem value="帆布製品製造">Produk Kanvas (帆布製品製造)</SelectItem>
                                        <SelectItem value="布はく縫製">Penjahitan Tenun (布はく縫製)</SelectItem>
                                        <SelectItem value="座席シート縫製">Penjahitan Jok (座席シート縫製)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">6. 機械・金属関係 - Mesin & Logam</SelectLabel>
                                        <SelectItem value="鋳造">Pengecoran (鋳造)</SelectItem>
                                        <SelectItem value="鍛造">Penempaan (鍛造)</SelectItem>
                                        <SelectItem value="ダイカスト">Die Casting (ダイカスト)</SelectItem>
                                        <SelectItem value="機械加工">Pemrosesan Mesin (機械加工)</SelectItem>
                                        <SelectItem value="金属プレス加工">Press Logam (金属プレス加工)</SelectItem>
                                        <SelectItem value="鉄工">Pekerjaan Besi (鉄工)</SelectItem>
                                        <SelectItem value="工場板金">Pelat Logam Pabrik (工場板金)</SelectItem>
                                        <SelectItem value="めっき">Pelapisan/Mekki (めっき)</SelectItem>
                                        <SelectItem value="アルミニウム陽極酸化処理">Anodisasi Alum (アルミニウム陽極酸化処理)</SelectItem>
                                        <SelectItem value="仕上げ">Finishing (仕上げ)</SelectItem>
                                        <SelectItem value="機械検査">Pemeriksaan Mesin (機械検査)</SelectItem>
                                        <SelectItem value="機械保全">Pemeliharaan Mesin (機械保全)</SelectItem>
                                        <SelectItem value="電子機器組立て">Perakitan Elektronik (電子機器組立て)</SelectItem>
                                        <SelectItem value="電気機器組立て">Perakitan Listrik (電気機器組立て)</SelectItem>
                                        <SelectItem value="プリント配線板製造">Pembuatan PCB (プリント配線板製造)</SelectItem>
                                        <SelectItem value="アルミニウム圧延・押出製品製造">Ekstrusi Alum (アルミニウム圧延・押出製品製造)</SelectItem>
                                        <SelectItem value="金属熱処理業">Heat Treatment (金属熱処理業)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">7. その他 - Lain-lain</SelectLabel>
                                        <SelectItem value="家具製作">Furnitur (家具製作)</SelectItem>
                                        <SelectItem value="印刷">Percetakan (印刷)</SelectItem>
                                        <SelectItem value="製本">Penjilidan (製本)</SelectItem>
                                        <SelectItem value="プラスチック成形">Pembentukan Plastik (プラスチック成形)</SelectItem>
                                        <SelectItem value="強化プラスチック成形">Plastik Diperkuat (強化プラスチック成形)</SelectItem>
                                        <SelectItem value="塗装">Pengecatan (塗装)</SelectItem>
                                        <SelectItem value="溶接">Pengelasan (溶接)</SelectItem>
                                        <SelectItem value="工業包装">Pengemasan Industri (工業包装)</SelectItem>
                                        <SelectItem value="紙器・段ボール箱製造">Kotak Karton (紙器・段ボール箱製造)</SelectItem>
                                        <SelectItem value="陶磁器工業製品製造">Produk Keramik (陶磁器工業製品製造)</SelectItem>
                                        <SelectItem value="自動車整備">Perawatan Mobil (自動車整備)</SelectItem>
                                        <SelectItem value="ビルクリーニング">Pembersihan Gedung (ビルクリーニング)</SelectItem>
                                        <SelectItem value="介護">Perawatan Lansia/Kaigo (介護)</SelectItem>
                                        <SelectItem value="リネンサプライ">Linen Supply (リネンサプライ)</SelectItem>
                                        <SelectItem value="コンクリート製品製造">Produk Beton (コンクリート製品製造)</SelectItem>
                                        <SelectItem value="宿泊">Perhotelan (宿泊)</SelectItem>
                                        <SelectItem value="RPF製造">RPF (RPF製造)</SelectItem>
                                        <SelectItem value="産業洗浄業務">Pencucian Industri (産業洗浄業務)</SelectItem>
                                        <SelectItem value="ゴム製品製造">Produk Karet (ゴム製品製造)</SelectItem>
                                        <SelectItem value="鉄道車両整備">Kereta Api (鉄道車両整備)</SelectItem>
                                        <SelectItem value="木材加工">Pemrosesan Kayu (木材加工)</SelectItem>

                                        <SelectLabel className="text-amber-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-4">Sertifikasi Internal</SelectLabel>
                                        <SelectItem value="空港グランドハンドリング（社内検定）">Handling Bandara</SelectItem>
                                        <SelectItem value="ボイラーメンテナンス（社内検定）">Pemeliharaan Boiler</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.industry && <p className="text-xs text-red-500 font-medium">{errors.industry}</p>}
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {/* LOKASI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <MapPin size={12} /> Prefektur (Ken)
                            </label>
                            <Select 
                                value={data.prefecture} 
                                onValueChange={v => setData('prefecture', v)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih Prefektur" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px]">
                                    {/* HOKKAIDO & TOHOKU */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-1">Hokkaido & Tohoku</SelectLabel>
                                        <SelectItem value="北海道">Hokkaido</SelectItem>
                                        <SelectItem value="青森県">Aomori</SelectItem>
                                        <SelectItem value="岩手県">Iwate</SelectItem>
                                        <SelectItem value="宮城県">Miyagi</SelectItem>
                                        <SelectItem value="秋田県">Akita</SelectItem>
                                        <SelectItem value="山形県">Yamagata</SelectItem>
                                        <SelectItem value="福島県">Fukushima</SelectItem>
                                    </SelectGroup>

                                    {/* KANTO */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-3">Kanto</SelectLabel>
                                        <SelectItem value="茨城県">Ibaraki</SelectItem>
                                        <SelectItem value="栃木県">Tochigi</SelectItem>
                                        <SelectItem value="群馬県">Gunma</SelectItem>
                                        <SelectItem value="埼玉県">Saitama</SelectItem>
                                        <SelectItem value="千葉県">Chiba</SelectItem>
                                        <SelectItem value="東京都">Tokyo</SelectItem>
                                        <SelectItem value="神奈川県">Kanagawa</SelectItem>
                                    </SelectGroup>

                                    {/* CHUBU */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-3">Chubu</SelectLabel>
                                        <SelectItem value="新潟県">Niigata</SelectItem>
                                        <SelectItem value="富山県">Toyama</SelectItem>
                                        <SelectItem value="石川県">Ishikawa</SelectItem>
                                        <SelectItem value="福井県">Fukui</SelectItem>
                                        <SelectItem value="山梨県">Yamanashi</SelectItem>
                                        <SelectItem value="長野県">Nagano</SelectItem>
                                        <SelectItem value="岐阜県">Gifu</SelectItem>
                                        <SelectItem value="静岡県">Shizuoka</SelectItem>
                                        <SelectItem value="愛知県">Aichi</SelectItem>
                                    </SelectGroup>

                                    {/* KANSAI */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-3">Kansai</SelectLabel>
                                        <SelectItem value="三重県">Mie</SelectItem>
                                        <SelectItem value="滋賀県">Shiga</SelectItem>
                                        <SelectItem value="京都府">Kyoto</SelectItem>
                                        <SelectItem value="大阪府">Osaka</SelectItem>
                                        <SelectItem value="兵庫県">Hyogo</SelectItem>
                                        <SelectItem value="奈良県">Nara</SelectItem>
                                        <SelectItem value="和歌山県">Wakayama</SelectItem>
                                    </SelectGroup>

                                    {/* CHUGOKU & SHIKOKU */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-3">Chugoku & Shikoku</SelectLabel>
                                        <SelectItem value="鳥取県">Tottori</SelectItem>
                                        <SelectItem value="島根県">Shimane</SelectItem>
                                        <SelectItem value="岡山県">Okayama</SelectItem>
                                        <SelectItem value="広島県">Hiroshima</SelectItem>
                                        <SelectItem value="山口県">Yamaguchi</SelectItem>
                                        <SelectItem value="徳島県">Tokushima</SelectItem>
                                        <SelectItem value="香川県">Kagawa</SelectItem>
                                        <SelectItem value="愛媛県">Ehime</SelectItem>
                                        <SelectItem value="高知県">Kochi</SelectItem>
                                    </SelectGroup>

                                    {/* KYUSHU & OKINAWA */}
                                    <SelectGroup>
                                        <SelectLabel className="text-blue-600 font-black py-2 bg-slate-50 dark:bg-zinc-900 mt-3">Kyushu & Okinawa</SelectLabel>
                                        <SelectItem value="福岡県">Fukuoka</SelectItem>
                                        <SelectItem value="佐賀県">Saga</SelectItem>
                                        <SelectItem value="長崎県">Nagasaki</SelectItem>
                                        <SelectItem value="熊本県">Kumamoto</SelectItem>
                                        <SelectItem value="大分県">Oita</SelectItem>
                                        <SelectItem value="宮崎県">Miyazaki</SelectItem>
                                        <SelectItem value="鹿児島県">Kagoshima</SelectItem>
                                        <SelectItem value="沖縄県">Okinawa</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {errors.prefecture && <p className="text-xs text-red-500 font-medium">{errors.prefecture}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Laptop size={12} /> Website
                            </label>
                            <Input 
                                value={data.website} 
                                onChange={e => setData('website', e.target.value)} 
                                onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                                        setData('website', `https://${value}`);
                                    }
                                }}
                                placeholder="www.tanaka.co.jp" 
                                className="h-11" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Alamat Alfabet</label>
                            <Textarea value={data.address} onChange={e => setData('address', e.target.value)} className="resize-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Alamat Kanji</label>
                            <Textarea value={data.address_in_japanese} onChange={e => setData('address_in_japanese', e.target.value)} className="resize-none font-japanese" />
                        </div>
                    </div>

                    <hr className="border-sidebar-border" />

                    {/* KONTAK */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><User size={12} /> PIC Perusahaan</label>
                            <Input value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Phone size={12} /> Telepon</label>
                            <Input value={data.phone} onChange={e => setData('phone', e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Mail size={12} /> Email</label>
                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="h-11" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-sidebar-border">
                        <Button variant="ghost" type="button" onClick={() => window.history.back()}>Batal</Button>
                        <Button disabled={processing} className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px] h-11">
                            {processing ? 'Menyimpan...' : (isEdit ? 'Update Perusahaan' : 'Simpan Perusahaan')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}