import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const golden=JSON.parse(readFileSync(new URL('../golden-seeds.json',import.meta.url),'utf8'));

test('production WASM loads, generates, repeats after reload, and changes worlds', async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#hash')).toHaveText(golden.hashes['moonlit-run']);
  await expect(page.locator('#validation')).toHaveText('Connected');
  await page.getByRole('button',{name:'Last light',exact:true}).click();
  await expect(page.locator('#hash')).toHaveText(golden.hashes['last-light']);
  const mapBefore=await page.locator('#map').innerHTML();
  await page.getByRole('button',{name:'Trace this world'}).click();
  await expect(page.locator('#map')).toHaveJSProperty('innerHTML',mapBefore);
  await page.reload();
  await expect(page.locator('#hash')).toHaveText(golden.hashes['moonlit-run']);
  await page.getByLabel('World seed').fill('रात 🌙');
  await page.getByRole('button',{name:'Trace this world'}).click();
  await expect(page.getByRole('status')).toContainText('रात 🌙');
  expect(errors).toEqual([]);
});

test('input errors preserve last valid world; seed text is never injected as HTML',async({page})=>{
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-ready','true');
  const initial=await page.locator('#hash').textContent();
  await page.getByLabel('World seed').fill('  ');
  await page.getByRole('button',{name:'Trace this world'}).click();
  await expect(page.getByLabel('World seed')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#hash')).toHaveText(initial!);
  await page.getByLabel('World seed').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button',{name:'Trace this world'}).click();
  await expect(page.getByRole('status')).toContainText('<img src=x onerror=alert(1)>');
  expect(await page.locator('img').count()).toBe(0);
  await page.getByRole('button',{name:'Surprise me'}).click();
  await expect(page.getByLabel('World seed')).toHaveValue(/^night-[a-f0-9]{8}$/);
});

test('nested path works and mobile layout fits',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/games/night-ride/');
  await expect(page.locator('#hash')).toHaveText(golden.hashes['moonlit-run']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByLabel('World seed').fill('last-light');
  await page.getByLabel('World seed').press('Enter');
  await expect(page.locator('#hash')).toHaveText(golden.hashes['last-light']);
});

test('missing WASM gives an actionable error',async({page})=>{
  await page.route('**/*.wasm',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('could not start');
  await expect(page.locator('#validation')).toHaveText('Unavailable');
  await expect(page.getByRole('button',{name:'Trace this world'})).toBeDisabled();
});
