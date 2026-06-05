<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>請求書 {{ $invoice->invoice_number }}</title>
    @php
        $org = $invoice->acceptingOrganization;
        $orgName = $org?->name_in_japanese ?: $org?->name;

        $issuer = [
            'heading' => '日本語教育センター及び送り出し機関',
            'name'    => 'PT OOSAKA GAKKOU INDONESIA',
            'postal'  => '〒64173',
            'address' => ['Jl. Raya Wates Kediri RT 008 RW 00', 'Desa Ngletih Kec. Kandat Kab. Kediri, Jawa Timur'],
        ];

        $bank = [
            ['NAME', '（英語会社名）', ['PT OOSAKA GAKKOU INDONESIA']],
            ['ADDRESS', '（所在地）', ['Jl. Raya Wates Kediri RT 008 RW 00', 'Desa Ngletih Kec. Kandat Kab. Kediri, Jawa Timur 64173']],
            ['Company Office Number', '（電話番号）', ['+62-857-4594-5292']],
            ['ACCOUNT NO.', '（口座番号）', ['710636903']],
            ["BENEFICIARY'S BANK", '（送金先銀行名）', ['BANK NEGARA INDONESIA']],
            ['Swift BIC Code', '', ['BNINIDJAXXX']],
            ['Account Opening Bank Address', '（銀行所在地）', ['Jl. Brawijaya No.17, Pakelan, Kec. Kota, Kota Kediri, Jawa Timur 64129']],
        ];

        $yen = fn ($n) => number_format((int) $n) . '円';
        // 単価 = harga per orang untuk seluruh periode (= 金額 ÷ orang), tidak per bulan.
        $unitForPeriod = fn ($it) => $it->people > 0 ? intdiv((int) $it->amount, (int) $it->people) : (int) $it->amount;
        $title = function ($it) {
            return match ($it->kind) {
                'travel'        => $it->company_name . ' 渡航費',
                'pre_education' => $it->company_name . ' 事前教育費',
                default         => $it->company_name . ' ' . $it->people . '人',
            };
        };
    @endphp
    <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
            font-family: "Noto Sans JP", "Hiragino Kaku Gothic Pro", "Yu Gothic", "Meiryo", "MS PGothic", sans-serif;
            color: #18181b;
            font-size: 13px;
            line-height: 1.6;
            background: #f4f4f5;
        }
        .sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 12px auto;
            padding: 16mm 14mm;
            background: #fff;
        }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px; }
        h1.title { text-align: center; font-size: 26px; letter-spacing: .35em; margin: 14px 0 22px; font-weight: 700; }
        .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 26px; }
        .recipient .name { font-size: 17px; font-weight: 700; border-bottom: 1px solid #71717a; display: inline-block; padding-bottom: 2px; }
        .recipient .lead { margin-top: 8px; font-size: 13px; }
        .issuer { text-align: left; font-size: 12px; min-width: 48%; }
        .issuer .h { font-weight: 600; }
        .issuer .n { font-weight: 700; }
        .issuer .addr { color: #52525b; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        table.items th, table.items td { border: 1px solid #c4c4c8; padding: 7px 8px; vertical-align: top; }
        table.items th { background: #f4f4f5; font-size: 12px; font-weight: 700; }
        .c { text-align: center; }
        .r { text-align: right; }
        .num { font-variant-numeric: tabular-nums; }
        .item-title { font-weight: 600; }
        .item-sub { font-size: 11px; color: #52525b; }
        .item-students { font-size: 11px; color: #0369a1; margin-top: 2px; }
        .total td { font-weight: 700; padding: 10px 8px; }
        .pay-title { margin: 26px 0 8px; font-weight: 700; }
        table.bank td { border: 1px solid #c4c4c8; padding: 7px 10px; font-size: 11px; vertical-align: top; }
        table.bank td.label { width: 34%; font-weight: 600; }
        table.bank td.label .sub { display: block; color: #52525b; font-weight: 400; }
        .toolbar { max-width: 210mm; margin: 12px auto 0; text-align: right; }
        .btn {
            display: inline-block; cursor: pointer; border: 0; border-radius: 8px;
            background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600;
            padding: 10px 18px; font-family: inherit;
        }
        .btn.secondary { background: #e4e4e7; color: #27272a; margin-right: 8px; }
        @media print {
            body { background: #fff; }
            .sheet { margin: 0; width: auto; min-height: auto; padding: 0; }
            .toolbar { display: none; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button class="btn secondary" onclick="window.close()">Tutup</button>
        <button class="btn" onclick="window.print()">Cetak / Simpan PDF</button>
    </div>

    <div class="sheet">
        <div class="topbar">
            <div>請求番号：<strong class="num">{{ $invoice->invoice_number }}</strong></div>
            <div>請求日：{{ $invoice->issue_date?->format('Y年n月j日') }}</div>
        </div>

        <h1 class="title">請求書</h1>

        <div class="parties">
            <div class="recipient">
                <div class="name">{{ $orgName }} 御中</div>
                <div class="lead">下記のとおりご請求申し上げます。</div>
            </div>
            <div class="issuer">
                <div class="h">{{ $issuer['heading'] }}</div>
                <div class="n">{{ $issuer['name'] }}</div>
                <div style="margin-top:6px">{{ $issuer['postal'] }}</div>
                @foreach ($issuer['address'] as $line)
                    <div class="addr">{{ $line }}</div>
                @endforeach
            </div>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th style="width:36px">番号</th>
                    <th>品名</th>
                    <th style="width:70px" class="c">数量</th>
                    <th style="width:96px" class="r">単価</th>
                    <th style="width:110px" class="r">金額</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoice->items as $i => $it)
                    <tr>
                        <td class="c num">{{ $i + 1 }}</td>
                        <td>
                            <div class="item-title">{{ $title($it) }}</div>
                            @if ($it->kind === 'management' && $it->description)
                                <div class="item-sub">{{ $it->description }}</div>
                            @endif
                            @if (!empty($it->students))
                                <div class="item-students">対象者: {{ implode('、', $it->students) }}</div>
                            @endif
                        </td>
                        <td class="c num">{{ $it->people }}名</td>
                        <td class="r num">{{ $yen($unitForPeriod($it)) }}</td>
                        <td class="r num">{{ $yen($it->amount) }}</td>
                    </tr>
                @endforeach
                <tr class="total">
                    <td colspan="4" class="c">合計</td>
                    <td class="r num">{{ $yen($invoice->total_amount) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="pay-title">振込先：</div>
        <table class="bank">
            <tbody>
                @foreach ($bank as [$label, $sub, $values])
                    <tr>
                        <td class="label">
                            {{ $label }}
                            @if ($sub)<span class="sub">{{ $sub }}</span>@endif
                        </td>
                        <td>
                            @foreach ($values as $v)
                                <div>{{ $v }}</div>
                            @endforeach
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>
