"""
ARISE V4.0 — Bulk Equipment Asset Generator
Uses Pollinations.ai (free, Flux-based) to generate all store items.
Run: python generate_assets.py
"""
import urllib.request, os, time, sys

BASE_URL = "https://image.pollinations.ai/prompt/"
WIDTH, HEIGHT = 512, 512
MODEL = "flux-anime"
OUT_ROOT = os.path.join(os.path.dirname(__file__), "public", "assets")

STYLE = "dark fantasy RPG item icon, Solo Leveling shadow aesthetic, glowing magical accents, highly detailed, centered on pitch black void background, no text, no watermark"

# ── All items organized by folder ──
ITEMS = {
    "loot": {
        "box_basic":   "A wooden crate banded with dark iron, faintly glowing blue light from its cracks",
        "box_premium": "A sleek obsidian loot box adorned with glowing cyan and purple runes, emitting dark smoke",
        "box_monarch": "An otherworldly floating chest made of shadow and starlight, radiating intense violet and cyan aura",
    },
    "equipment/e": {
        "e_sword":  "A rusted iron broadsword with a leather-wrapped hilt, dull and worn",
        "e_dagger": "A simple chipped steel hunting dagger",
        "e_staff":  "A gnarled wooden staff topped with a dim cracked grey crystal",
        "e_chest":  "A patched leather tunic armor with rusty iron studs",
        "e_helm":   "A battered iron skullcap helmet showing heavy wear",
        "e_gloves": "Threadbare leather half-gloves, worn and basic",
        "e_boots":  "Worn out traveler boots caked in dried mud",
        "e_ring":   "A tarnished copper ring with no gem",
        "e_amulet": "A simple piece of twine holding a carved wooden wolf fang pendant",
        "e_shield": "A splintering round wooden buckler shield",
    },
    "equipment/d": {
        "d_sword":  "A polished steel longsword with a crossguard, standard issue",
        "d_dagger": "A sleek curved assassin knife with a faint silver edge",
        "d_mace":   "A heavy iron flanged mace, brutal and efficient",
        "d_chest":  "A polished chainmail hauberk over dark leather armor",
        "d_helm":   "A steel visored helmet, standard knight gear",
        "d_gloves": "Steel-plated leather gauntlets",
        "d_boots":  "Heavy steel-toed combat boots",
        "d_ring":   "A smooth silver ring inset with a tiny ruby gemstone",
        "d_amulet": "A silver chain holding a polished green jade stone pendant",
        "d_shield": "A sturdy steel kite shield bearing a faded crest",
    },
    "equipment/c": {
        "c_sword":  "A masterwork greatsword made of folded dark steel, faintly glowing red along the blade edge",
        "c_dagger": "A pair of toxic neon green daggers dripping with digital venom",
        "c_spear":  "A long halberd with a blade forged from blue ice, emitting cold mist",
        "c_chest":  "Heavy midnight-blue plate armor adorned with small magical runes",
        "c_helm":   "A dark metallic hood-helmet hybrid with glowing blue eyes",
        "c_gloves": "Obsidian gauntlets that crackle with faint blue lightning",
        "c_boots":  "Sleek aerodynamic greaves made of dark purple alloy",
        "c_ring":   "A gold ring engraved with runes, glowing faintly blue",
        "c_amulet": "A beautiful amulet holding a glowing cyan mana crystal emitting soft light",
        "c_shield": "A heavy aegis shield forged from black iron with glowing veins of cyan mana across it",
    },
    "equipment/b": {
        "b_sword":    "A curved katana made entirely of black glass, trailing dark shadowy smoke",
        "b_dagger":   "A jagged serrated bone-dagger glowing with cursed purple energy",
        "b_scythe":   "A grim reaper scythe with a blade of pure glowing cyan plasma",
        "b_chest":    "Pure jet-black assassin armor layered with glowing cyan circuitry",
        "b_helm":     "A demonic half-mask covering the lower face, made of black metal with glowing purple accents",
        "b_gloves":   "Beast claws gauntlets ending in razor sharp glowing cyan talons",
        "b_boots":    "Shadow-walker boots leaving a trail of dark violet smoke",
        "b_ring":     "A floating ethereal ring made of concentrated blue flames",
        "b_amulet":   "The eye of a drake suspended on an obsidian chain, glowing fiery orange",
        "b_grimoire": "A floating open black grimoire spellbook with pages emitting blinding cyan light",
    },
    "equipment/a": {
        "a_sword":  "The Knight Commander Longsword, a massive ornate blade of pure white and gold light piercing through dark shadows",
        "a_dagger": "Kasaka Venom Fang, a legendary dagger carved from a serpent tooth dripping with highly toxic purple acid",
        "a_bow":    "An ethereal longbow constructed entirely from crackling cyan lightning",
        "a_chest":  "High Orc Warlord Plate, thick brutalist crimson armor radiating dark red heat and shadow smoke",
        "a_helm":   "A crown of dark ice and black spikes",
        "a_gloves": "Gauntlets of the Blood Red Commander with deep crimson runes and shadow emission",
        "a_boots":  "Greaves forged from meteor steel leaving trails of starry light",
        "a_ring":   "A ring containing a trapped swirling purple galaxy inside",
        "a_amulet": "A glowing heart made of pure crystallized blue mana suspended in dark energy",
        "a_orb":    "A floating sphere of concentrated absolute zero ice freezing the air around it",
    },
    "equipment/s": {
        "s_dagger": "The Demon King Dagger, the ultimate weapon, a jagged dual-blade made of absolute darkness burning with furious violet and cyan aura",
        "s_sword":  "The Shadow Monarch Greatsword, a colossal blade of shifting shadow and starlight commanding absolute authority",
        "s_spear":  "Spear of the Ice Monarch, a terrifying halberd that freezes light itself emitting a blizzard",
        "s_chest":  "The Monarch Absolute Armor, sleek terrifying black metallic biological plating constantly emitting intense dark purple and cyan shadow-aura",
        "s_helm":   "The Crown of Shadows, a floating halo of black flames and jagged obsidian spikes",
        "s_gloves": "The Rulers Gauntlets, heavenly white and gold armor emitting six glowing wings of light from the forearms",
        "s_boots":  "Boots of the Swift Assassin, stepping causes the dimension to crack like glass with purple light",
        "s_ring":   "The Ring of the System, a hyper-futuristic holographic ring containing absolute code sequences in cyan",
        "s_amulet": "The Heart of the World Tree, an intensely glowing green and gold artifact pulsating with infinite life energy",
        "s_cloak":  "The Cloak of the Shadow Sovereign, a pitch-black tattered cape that fades into the void absorbing all light",
    },
}

def download_image(prompt, filepath):
    full_prompt = f"{prompt}, {STYLE}"
    seed = int(time.time() * 1000) % 999999
    encoded = urllib.parse.quote(full_prompt + f" | seed {seed}")
    url = f"{BASE_URL}{encoded}?width={WIDTH}&height={HEIGHT}&nologo=true&safe=false&model={MODEL}"
    
    for attempt in range(3):
        try:
            urllib.request.urlretrieve(url, filepath)
            size = os.path.getsize(filepath)
            if size > 5000:  # Valid image
                return True
            print(f"  ⚠ Small file ({size}B), retrying...")
        except Exception as e:
            print(f"  ✗ Attempt {attempt+1} failed: {e}")
        time.sleep(2)
    return False

def main():
    total = sum(len(v) for v in ITEMS.values())
    done = 0
    failed = []

    print(f"\n⚔️  ARISE V4.0 — Asset Generator")
    print(f"   Generating {total} items via Pollinations.ai (Flux)\n")
    
    for folder, items in ITEMS.items():
        out_dir = os.path.join(OUT_ROOT, folder)
        os.makedirs(out_dir, exist_ok=True)
        
        for name, prompt in items.items():
            done += 1
            filepath = os.path.join(out_dir, f"{name}.png")
            
            if os.path.exists(filepath) and os.path.getsize(filepath) > 5000:
                print(f"  [{done}/{total}] ✓ {name}.png (exists, skipping)")
                continue
            
            print(f"  [{done}/{total}] ⏳ {name}.png ...", end=" ", flush=True)
            
            if download_image(prompt, filepath):
                print(f"✓ ({os.path.getsize(filepath)//1024}KB)")
            else:
                print("✗ FAILED")
                failed.append(name)
            
            time.sleep(1.5)  # Rate limit courtesy
    
    print(f"\n{'='*40}")
    print(f"  ✅ Complete: {done - len(failed)}/{total}")
    if failed:
        print(f"  ❌ Failed: {', '.join(failed)}")
    print(f"  📁 Output: {OUT_ROOT}")
    print(f"{'='*40}\n")

if __name__ == "__main__":
    main()
