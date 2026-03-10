<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);
set_time_limit(0);

$baseDir = __DIR__;
$dumpPath = $baseDir . DIRECTORY_SEPARATOR . 'gesconjm_sgicontrol.sql';

$codeRoots = [
    $baseDir . DIRECTORY_SEPARATOR . 'src',
    $baseDir . DIRECTORY_SEPARATOR . 'componentes',
    $baseDir,
];

$scanExtensions = ['php', 'js'];

$skipDirNames = [
    '.git',
    'vendor',
    'node_modules',
    'database',
    'public',
    'storage',
    'cache',
];

$skipFileNames = [
    basename($dumpPath),
    'gesconjm_sgicontrol.sql',
    'gesconjm_sgicontrol (15).sql',
];

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function readFileSafe(string $path): string
{
    $data = @file_get_contents($path);
    return is_string($data) ? $data : '';
}

function extractTablesFromDump(string $dumpContent): array
{
    preg_match_all('/CREATE\s+TABLE\s+`([^`]+)`/i', $dumpContent, $m);
    $tables = $m[1] ?? [];
    $tables = array_values(array_unique($tables));
    sort($tables, SORT_STRING);
    return $tables;
}

function iterFiles(string $dir, array $extensions, array $skipDirNames, array $skipFileNames): Generator
{
    if (!is_dir($dir)) {
        return;
    }

    $directoryIterator = new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS);
    $filter = new RecursiveCallbackFilterIterator(
        $directoryIterator,
        static function (SplFileInfo $current, string $key, $iterator) use ($skipDirNames, $skipFileNames): bool {
            if ($current->isDir()) {
                return !in_array($current->getFilename(), $skipDirNames, true);
            }
            return !in_array($current->getFilename(), $skipFileNames, true);
        }
    );
    $it = new RecursiveIteratorIterator($filter);

    foreach ($it as $file) {
        /** @var SplFileInfo $file */
        if (!$file->isFile()) {
            continue;
        }
        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $extensions, true)) {
            continue;
        }
        yield $file->getPathname();
    }
}

function buildUsedTableIndex(array $tables, array $codeRoots, array $extensions, array $skipDirNames, array $skipFileNames): array
{
    $used = [];
    $examples = [];
    $tablePatterns = [];
    foreach ($tables as $t) {
        // Word boundary doesn't work with underscores well in all cases, use manual boundaries
        $tablePatterns[$t] = '/(^|[^a-zA-Z0-9_])' . preg_quote($t, '/') . '([^a-zA-Z0-9_]|$)/i';
    }

    foreach ($codeRoots as $root) {
        foreach (iterFiles($root, $extensions, $skipDirNames, $skipFileNames) as $filePath) {
            $content = readFileSafe($filePath);
            if ($content === '') {
                continue;
            }

            foreach ($tablePatterns as $table => $pattern) {
                if (isset($used[$table])) {
                    continue;
                }
                if (preg_match($pattern, $content)) {
                    $used[$table] = true;
                    $examples[$table] = $filePath;
                }
            }
        }
    }

    return [$used, $examples];
}

$dumpContent = readFileSafe($dumpPath);
$error = null;
if ($dumpContent === '') {
    $error = 'No se pudo leer el dump: ' . $dumpPath;
}

$tables = $dumpContent !== '' ? extractTablesFromDump($dumpContent) : [];

[$usedIndex, $usedExamples] = buildUsedTableIndex($tables, $codeRoots, $scanExtensions, $skipDirNames, $skipFileNames);

$unused = [];
foreach ($tables as $t) {
    if (!isset($usedIndex[$t])) {
        $unused[] = $t;
    }
}

$dropSql = "SET FOREIGN_KEY_CHECKS = 0;\n\n";
foreach ($unused as $t) {
    $dropSql .= "DROP TABLE IF EXISTS `{$t}`;\n";
}
$dropSql .= "\nSET FOREIGN_KEY_CHECKS = 1;\n";

?><!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte de tablas no referenciadas</title>
  <style>
    body{font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 20px;}
    pre{background:#0b1020; color:#e6e6e6; padding:12px; border-radius:8px; overflow:auto;}
    code{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;}
    table{border-collapse: collapse; width: 100%;}
    th,td{border:1px solid #ddd; padding:8px; font-size: 13px;}
    th{background:#f5f5f5; text-align:left;}
    .muted{color:#666;}
    .danger{color:#a00; font-weight:600;}
  </style>
</head>
<body>

<h2>Reporte de tablas no referenciadas (heurístico)</h2>

<?php if ($error): ?>
  <p class="danger"><?php echo h($error); ?></p>
<?php else: ?>
  <p class="muted">
    Dump: <code><?php echo h($dumpPath); ?></code><br>
    Total tablas en dump: <strong><?php echo count($tables); ?></strong><br>
    Tablas detectadas como usadas (string match): <strong><?php echo count($usedIndex); ?></strong><br>
    Tablas detectadas como NO usadas: <strong><?php echo count($unused); ?></strong>
  </p>

  <h3>Tablas usadas (ejemplo de archivo donde aparece el nombre)</h3>
  <table>
    <thead><tr><th>Tabla</th><th>Ejemplo</th></tr></thead>
    <tbody>
    <?php foreach ($tables as $t): ?>
      <?php if (!isset($usedIndex[$t])) continue; ?>
      <tr>
        <td><code><?php echo h($t); ?></code></td>
        <td class="muted"><code><?php echo h($usedExamples[$t] ?? ''); ?></code></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <h3>Tablas NO usadas (candidatas)</h3>
  <table>
    <thead><tr><th>Tabla</th></tr></thead>
    <tbody>
    <?php foreach ($unused as $t): ?>
      <tr><td><code><?php echo h($t); ?></code></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <h3>Script sugerido (NO ejecutado)</h3>
  <p class="danger">No lo ejecutes sin backup. Esto es heurístico; puede romper la app si hay SQL dinámico/SP/vistas.</p>
  <pre><code><?php echo h($dropSql); ?></code></pre>
<?php endif; ?>

</body>
</html>