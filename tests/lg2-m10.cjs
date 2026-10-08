/* Verificação independente da planilha; execute: node tests/lg2-m10.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public/lg2/turma-a/m10');
const source = process.env.LG2_M10_XLSX;
assert.ok(source && fs.existsSync(source), 'Defina LG2_M10_XLSX com o caminho da planilha original (não publicada).');
assert.ok(fs.existsSync(path.join(dir, 'dados/perguntas.json')), 'M10 deve incluir as perguntas da planilha');
const data = JSON.parse(fs.readFileSync(path.join(dir, 'dados/perguntas.json'), 'utf8'));
const python = `import zipfile, xml.etree.ElementTree as E, json, sys
z=zipfile.ZipFile(sys.argv[1]); n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',n)] if 'xl/sharedStrings.xml' in z.namelist() else []
r={x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
s=next(x for x in E.fromstring(z.read('xl/workbook.xml')).find('m:sheets',n) if x.attrib['name']=='3 Fluxo de perguntas')
t=r[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]; t=t.lstrip('/') if t.startswith('/') else 'xl/'+t
cells={}
for c in E.fromstring(z.read(t)).findall('.//m:sheetData/m:row/m:c',n):
 v=c.find('m:v',n); value=v.text if v is not None else ''.join(c.find('m:is',n).itertext()) if c.find('m:is',n) is not None else ''
 cells[c.attrib['r']]=ss[int(value)] if c.attrib.get('t')=='s' else value
print(json.dumps([{'id':cells.get('A'+str(i)) or 'linha-'+str(i),'codigo':cells.get('A'+str(i),''),'linha':i,'pergunta':cells['C'+str(i)],'tipoOriginal':cells.get('F'+str(i),'')} for i in range(5,20)],ensure_ascii=True))`;
const expected = JSON.parse(execFileSync(process.env.PYTHON || 'python3', ['-c', python, source], {encoding:'utf8'}));
assert.deepEqual(data.perguntas, expected);
assert.equal(data.perguntas.length, 15);
assert.equal(data.perguntas.filter(q => !q.codigo).length, 9);
assert.equal(data.origem.sha256, require('node:crypto').createHash('sha256').update(fs.readFileSync(source)).digest('hex'));
const registry = fs.readFileSync(path.join(root,'components/modules/laboratorio-gestao/turmas.ts'),'utf8');
assert.match(registry, /a:\s*\[1, 2, 5, 6, 10\]/);
console.log('PASS: 15 perguntas literais comparadas ao XLSX; 9 identificadores internos por linha.');

const http = require('node:http');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(process.env.PW || 'C:/Users/faelr/Downloads/reps/Academy/node_modules/playwright'); }
(async () => {
  const publicRoot = path.join(root, 'public');
  const server = http.createServer((req, res) => {
    const name = path.resolve(publicRoot, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!name.startsWith(publicRoot + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(name, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.ttf':'font/ttf'};
      res.writeHead(200, {'Content-Type':types[path.extname(name)] || 'application/octet-stream'}).end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await playwright.chromium.launch({headless:true});
    const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/lg2/turma-a/m10/index.html`);
    await page.getByRole('button',{name:'Começar',exact:true}).click({timeout:5000});
    const key = 'lg2-turma-a-m10';
    await page.evaluate(() => localStorage.setItem('lg2-turma-b-m10','sentinela'));
    const malicious = '<img src=x onerror="window.injetado=true"> & "teste"';
    for (let i=0; i<15; i++) {
      assert.equal(await page.locator('#pergunta').textContent(), expected[i].pergunta);
      assert.equal(await page.locator('textarea').count(),1);
      assert.equal(await page.locator('select,input[type=radio],input[type=checkbox]').count(),0);
      await page.locator('textarea').fill(i === 0 ? malicious : `Resposta ${i+1}`);
      if (i === 0) {
        await page.reload();
        await page.getByRole('button',{name:'Continuar de onde parei'}).click();
        assert.equal(await page.locator('textarea').inputValue(),malicious);
      }
      if (i === 1) {
        await page.getByRole('button',{name:'Voltar',exact:true}).click();
        assert.equal(await page.locator('textarea').inputValue(),malicious);
        await page.getByRole('button',{name:'Próxima',exact:true}).click();
        assert.equal(await page.locator('textarea').inputValue(),'Resposta 2');
      }
      await page.getByRole('button',{name:i === 14 ? 'Ver resumo' : 'Próxima',exact:true}).click();
    }
    assert.equal(await page.locator('.resposta').count(),15);
    assert.equal(await page.locator('.resposta').first().textContent(),malicious);
    assert.equal(await page.evaluate(() => window.injetado),undefined);
    assert.equal(await page.locator('.resumo img').count(),0);
    await page.reload();
    await page.getByRole('button',{name:'Continuar de onde parei'}).click();
    assert.equal(await page.locator('.resposta').count(),15);
    await page.getByRole('button',{name:'Editar resposta 8',exact:true}).click();
    await page.locator('textarea').fill('Resposta editada');
    await page.getByRole('button',{name:'Voltar ao resumo',exact:true}).click();
    assert.equal(await page.locator('.resposta').nth(7).textContent(),'Resposta editada');
    await page.evaluate(() => { window.print = () => { window.imprimiu = true; }; });
    await page.getByRole('button',{name:'Imprimir resumo'}).click();
    assert.equal(await page.evaluate(() => window.imprimiu),true);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.getByRole('button',{name:'Editar resposta 8',exact:true}).isVisible(),false);
    await page.emulateMedia({media:'screen'});
    const before = await page.evaluate(k => localStorage.getItem(k),key);
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button',{name:'Recomeçar do zero'}).click();
    assert.equal(await page.evaluate(k => localStorage.getItem(k),key),before);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button',{name:'Recomeçar do zero'}).click();
    assert.equal(await page.evaluate(k => localStorage.getItem(k),key),null);
    assert.equal(await page.evaluate(() => localStorage.getItem('lg2-turma-b-m10')),'sentinela');
    await page.reload();
    await page.getByRole('button',{name:'Começar',exact:true}).click();
    assert.equal(await page.locator('textarea').inputValue(),'');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    const screenshot = process.env.LG2_M10_SCREENSHOT || 'C:/Users/faelr/AppData/Local/hermes/work/lg2-m10/preview.png';
    fs.mkdirSync(path.dirname(screenshot),{recursive:true});
    await page.screenshot({path:screenshot,fullPage:true});
    assert.deepEqual(errors,[]);
    const published = [fs.readFileSync(path.join(dir,'index.html'),'utf8'),fs.readFileSync(path.join(dir,'js/app.js'),'utf8'),JSON.stringify(data)].join('\n');
    assert.ok(!published.includes(expected.perguntaExemplo || 'Quanto custa, em reais, o material usado em uma unidade do seu produto?'));
    assert.ok(!/M5\.|\b\d{10,11}\b/.test(published));
    // O arquivo privado usa doc_<hash>_<nome>_Template; não publicar nome pessoal no próprio teste.
    const personalTokens = path.basename(source).split('_Template')[0].split('_').slice(2).filter(token => token.length > 3);
    for (const token of personalTokens) assert.ok(!published.toUpperCase().includes(token.toUpperCase()));
    console.log('PASS: 15/15 perguntas alcançadas; texto aberto, recarga, voltar/editar, resumo, escape, impressão, cancelamento/reset e isolamento por turma.');
    console.log('PASS: celular 390x844, sem overflow ou erros do navegador. Screenshot: '+screenshot);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
