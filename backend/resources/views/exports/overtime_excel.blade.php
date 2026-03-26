<table>
    <!-- Row 1 -->
    <tr></tr>
    
    <!-- Row 2 -->
    <tr>
        <td></td>
        <td colspan="3" style="font-weight: bold; color: #0070c0; font-size: 11pt;">Form. Lembur-utk {{ $office_name }}</td>
    </tr>
    
    <!-- Row 3 -->
    <tr></tr>
    
    <!-- Row 4-7 -->
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td style="font-size: 11pt;">Kepada Yth,</td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td style="font-size: 11pt;">HRD - Personalia</td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td style="font-size: 11pt;">{{ $company_name }}</td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td style="font-size: 11pt;">Di Tempat</td></tr>
    
    <!-- Row 8 -->
    <tr></tr>
    
    <!-- Row 9-10 -->
    <tr><td></td><td colspan="6" style="font-size: 11pt;">Dengan Hormat,</td></tr>
    <tr><td></td><td colspan="6" style="font-size: 11pt;">Bersama ini diberitahukan bahwa kami menugaskan karyawan berikut untuk melakukan kerja lembur :</td></tr>
    
    <!-- Row 11 -->
    <tr><td></td><td colspan="6" style="font-size: 11pt;">Pada hari Tanggal : {{ $date_info }}</td></tr>
    
    <!-- Table Header (Row 12) -->
    <tr>
        <td></td>
        <th style="border: 1px solid black; background-color: #d9d9d9; text-align: center; font-weight: bold; font-size: 10pt;">No</th>
        <th style="border: 1px solid black; background-color: #d9d9d9; text-align: center; font-weight: bold; font-size: 10pt;">Nama</th>
        <th style="border: 1px solid black; background-color: #d9d9d9; text-align: center; font-weight: bold; font-size: 10pt;">Jam Mulai</th>
        <th style="border: 1px solid black; background-color: #d9d9d9;"></th>
        <th colspan="2" style="border: 1px solid black; background-color: #d9d9d9; text-align: center; font-weight: bold; font-size: 10pt;">Jam Selesai</th>
    </tr>
    
    <!-- Table 1 Body (Starts at Row 13) -->
    @foreach($overtimes as $index => $ot)
    <tr>
        <td></td>
        <td style="border: 1px solid black; text-align: center;">{{ $index + 1 }}</td>
        <td style="border: 1px solid black;">{{ $ot->user->name }}</td>
        <td style="border: 1px solid black; text-align: center;">{{ date('H:i', strtotime($ot->start_time)) }}</td>
        <td style="border: 1px solid black;"></td>
        <td colspan="2" style="border: 1px solid black; text-align: center;">{{ date('H:i', strtotime($ot->end_time)) }}</td>
    </tr>
    @endforeach
    @for($i = $overtimes->count(); $i < 5; $i++)
    <tr>
        <td></td>
        <td style="border: 1px solid black; text-align: center;">{{ $i + 1 }}</td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td colspan="2" style="border: 1px solid black;"></td>
    </tr>
    @endfor
    
    <!-- Table 2 Label (Dynamic Row) -->
    <tr>
        <td></td>
        <td colspan="6" style="font-style: italic; font-size: 10pt; text-align: center;">Untuk Melakukan Pekerjaan sebagaimana berikut ini :</td>
    </tr>
    
    <!-- Table 2 Body (Dynamic Row) -->
    @foreach($overtimes as $index => $ot)
    @php 
        $taskMonth = $months[date('F', strtotime($ot->date))];
        $taskDate = date('d', strtotime($ot->date)) . ' ' . $taskMonth . ' ' . date('Y', strtotime($ot->date));
    @endphp
    <tr>
        <td></td>
        <td style="border: 1px solid black; text-align: center;">{{ $index + 1 }}</td>
        <td colspan="5" style="border: 1px solid black;">{{ $taskDate }} - {{ $ot->reason }}</td>
    </tr>
    @endforeach
    @for($i = $overtimes->count(); $i < 5; $i++)
    <tr>
        <td></td>
        <td style="border: 1px solid black; text-align: center;">{{ $i + 1 }}</td>
        <td colspan="5" style="border: 1px solid black;"></td>
    </tr>
    @endfor
    
    <!-- Closing Labels -->
    <tr><td></td><td colspan="6" style="font-size: 10pt;">Demikian Untuk di ketahui</td></tr>
    <tr><td></td><td colspan="6" style="font-size: 10pt;">Catatan : Form lembur di berikan ke HRD sebelum melakukan aktifitas</td></tr>
    
    <!-- Signatures -->
    <tr></tr>
    <tr>
        <td></td>
        <td style="text-align: center; font-size: 11pt;">Diketahui</td>
        <td></td><td></td>
        <td style="text-align: center; font-size: 11pt;">Mengetahui</td>
        <td></td>
        <td style="text-align: right; font-size: 11pt;">Jakarta, {{ $today_date }}<br>Diajukan oleh:</td>
    </tr>
    <tr></tr><tr></tr><tr></tr><tr></tr>
    <tr>
        <td></td>
        <td style="text-align: center; font-size: 11pt;">({{ $hr_ga_name }})</td>
        <td></td><td></td>
        <td style="text-align: center; font-size: 11pt;">Operasional</td>
        <td></td>
        <td style="text-align: center; font-size: 11pt;">{{ $requester_name }}</td>
    </tr>
    <tr>
        <td></td>
        <td style="text-align: center; font-size: 11pt; font-weight: bold;">HR GA</td>
        <td></td><td></td>
        <td></td><td></td>
        <td></td>
    </tr>
</table>
