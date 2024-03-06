import { sha256 } from 'multiformats/hashes/sha2'
import * as dagPB from '@ipld/dag-pb'
import { CID } from 'multiformats/cid'
import { encode, decode, code } from 'multiformats/codecs/raw'
import { glob } from "glob";
import fs from 'fs';
import { exec } from 'child_process'

const raw_assets = await glob("./hardhat/test/NFTData/raw_assets/**", { nodir: true });
const raw_metadata = await glob("./hardhat/test/NFTData/raw_metadata/**", { nodir: true })
console.log(raw_assets)
console.log(raw_metadata)

// Get all the images from raw_metadata
let raw_metadata_content = []
let image_names = []
for(const raw_metadata_file_path of raw_metadata){

    console.log("raw_metadata_file_path")
    console.log(raw_metadata_file_path)

    let tmp_file_data = JSON.parse( await fs.readFileSync("./" + raw_metadata_file_path)  )
    raw_metadata_content.push(  tmp_file_data  )

    console.log("tmp_file_data")
    console.log(tmp_file_data)
    image_names.push(tmp_file_data.image)
}

// Check that the images are in raw_assets
let raw_asset_filenames = []
for(const raw_asset_filename of raw_assets){
    let tmp_split = raw_asset_filename.split("/")
    console.log("tmp_split")
    console.log(tmp_split)
    raw_asset_filenames.push(tmp_split[tmp_split.length - 1])   
}

console.log("image_names")
console.log(image_names)
console.log("raw_asset_filenames")
console.log(raw_asset_filenames)

for(const image_name of image_names){
    console.log("image_name")
    console.log(image_name)
    if(!raw_asset_filenames.includes(image_name)){
        throw new Error(`Bro where is image=${image_name} for one of your JSON files?`);
    }
}

console.log("raw_asset_filenames")
console.log(raw_asset_filenames)

// Create CID_assets folder, if it does not exist
console.log("CREATE CID_assets")
if (!fs.existsSync("./hardhat/test/NFTData/CID_assets")) {
    // If the folder does not exist, create it
    fs.mkdirSync("./hardhat/test/NFTData/CID_assets");
    console.log('./hardhat/test/NFTData/CID_assets created successfully!');
} else {
    console.log('./hardhat/test/NFTData/CID_assets already exists.');
}


// Create CID_metadata folder, if it does not exist
if (! (await fs.existsSync("./hardhat/test/NFTData/CID_metadata")  )  ) {
    // If the folder does not exist, create it
    fs.mkdirSync("./hardhat/test/NFTData/CID_metadata");
    console.log('./hardhat/test/NFTData/CID_metadata created successfully!');
} else {
    console.log('./hardhat/test/NFTData/CID_metadata already exists.');
}


// Hash all the assets
let asset_CIDs = {}
console.log("raw_assets")
console.log(raw_assets)
for(const tmp_asset_path of raw_assets){
    console.log("tmp_asset_path")
    console.log(tmp_asset_path)
    let value = await fs.readFileSync(tmp_asset_path)
    let data = await encode(value)
    const hash = await sha256.digest(data)
    const cidv1 = CID.create(1, code, hash)
    fs.copyFileSync(tmp_asset_path, `./hardhat/test/NFTData/CID_assets/${cidv1}`  )
    let tmp_split = tmp_asset_path.split("/")
    asset_CIDs[tmp_split[tmp_split.length - 1]] = {
        "path" : `./hardhat/test/NFTData/CID_assets/${cidv1}`,
        "CID"  : "ipfs://" + cidv1
    }
}
// save to asset_lookup.json
fs.writeFileSync("./hardhat/test/NFTData/asset_lookup.json", JSON.stringify(asset_CIDs, null, 2))


// Generate the CID_metadata

console.log("asset_CIDs")
console.log(asset_CIDs)

for(var i = 0; i < raw_metadata.length; i++){
    console.log("asset_CIDs")
    console.log(asset_CIDs)
    console.log("asset_CIDs[raw_metadata[i]]")
    console.log(asset_CIDs[raw_metadata[i]])
    console.log("raw_metadata[i]")
    console.log(raw_metadata[i].image)

    let tmp_file_data = JSON.parse( await fs.readFileSync("./" + raw_metadata[i])  )
    tmp_file_data.image = asset_CIDs[tmp_file_data.image].CID
    
    // Save it to CID_metadata folder
    fs.writeFileSync(`./hardhat/test/NFTData/CID_metadata/${i}`, JSON.stringify(asset_CIDs))
}
// Create CID_metadata folder for using ipfs-car
const { stdout , stderr } = await exec('npx ipfs-car pack ./hardhat/test/asset_CIDs > ./hardhat/test/NFTData/asset_CIDs.car');

const filePath = './hardhat/test/NFTData/asset_CIDs.car';
let value = await fs.readFileSync(filePath)
let data = await encode(value)
const hash = await sha256.digest(data)
const cidv1 = CID.create(1, code, hash)

console.log("cidv1")
console.log(cidv1)

await fs.writeFileSync(`./hardhat/test/NFTData/minting_data.json`, JSON.stringify({
    count : raw_metadata.length,
    CID   : cidv1
}))
