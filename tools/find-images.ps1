param([string[]]$Queries, [string]$Provider = "unsplash")

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
$all = @{}

foreach ($q in $Queries) {
    $enc = [uri]::EscapeDataString("site:images.$Provider.com $q")
    $html = & curl.exe -sS -A $ua "https://html.duckduckgo.com/html/?q=$enc" 2>&1 | Out-String
    $pat = if ($Provider -eq "unsplash") { 'images\.unsplash\.com/(photo-[0-9a-z\-]+)' } else { 'images\.pexels\.com/photos/(\d+)/([0-9a-z\-]+\.jpe?g)' }
    $m = [regex]::Matches($html, $pat)
    $ids = $m | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    Write-Output "### $q  -> $($ids.Count) ids"
    $ids | ForEach-Object { $all[$_] = $true }
}

Write-Output "`n=== ALL UNIQUE ($($all.Count)) ==="
$all.Keys | Sort-Object | ForEach-Object { Write-Output $_ }
