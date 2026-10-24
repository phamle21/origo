<?php

namespace Origo\Core\Screen\Tests;

use Illuminate\Validation\ValidationException;
use Origo\Core\Screen\Support\HtmlPackage;
use Tests\TestCase;
use ZipArchive;

class HtmlPackageTest extends TestCase
{
    /**
     * @param  array<string, string>  $files
     */
    private function zip(array $files): string
    {
        $path = tempnam(sys_get_temp_dir(), 'origo').'.zip';
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE);

        foreach ($files as $name => $contents) {
            $zip->addFromString($name, $contents);
        }

        $zip->close();

        return $path;
    }

    public function test_a_single_html_file_becomes_index_html(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'origo');
        file_put_contents($path, '<h1>Giỏ hàng</h1>');

        $package = (new HtmlPackage)->fromPath($path, 'cart.html');

        $this->assertSame('index.html', $package['entry']);
        $this->assertSame('<h1>Giỏ hàng</h1>', base64_decode($package['files']['index.html']));
    }

    public function test_a_zip_keeps_its_assets_and_skips_folders_and_mac_metadata(): void
    {
        $package = (new HtmlPackage)->fromPath($this->zip([
            'index.html' => '<link href="css/a.css">',
            'css/a.css' => 'body{}',
            '__MACOSX/._index.html' => 'x',
        ]), 'mockup.zip');

        $this->assertSame('index.html', $package['entry']);
        $this->assertSame(['index.html', 'css/a.css'], array_keys($package['files']));
    }

    public function test_a_zip_without_index_uses_its_only_root_page(): void
    {
        $package = (new HtmlPackage)->fromPath($this->zip(['cart.html' => 'a', 'assets/x.png' => 'b']), 'mockup.zip');

        $this->assertSame('cart.html', $package['entry']);
    }

    public function test_a_zip_with_an_ambiguous_or_missing_page_is_rejected(): void
    {
        $this->expectException(ValidationException::class);

        (new HtmlPackage)->fromPath($this->zip(['a.html' => 'a', 'b.html' => 'b']), 'mockup.zip');
    }

    public function test_a_zip_entry_that_climbs_out_of_the_folder_is_rejected(): void
    {
        $this->expectException(ValidationException::class);

        (new HtmlPackage)->fromPath($this->zip(['index.html' => 'a', '../../etc/passwd' => 'b']), 'mockup.zip');
    }
}
