# keg-scale

## TODO

- [ ] Change data stamp format? format time on ui! put into general section?
- [ ] Check if EEPROM is still working / is it normal to get emptied when flashing
- [ ] Make OTA working for both firmware and FS

## Building

### Platform IO

After entering the directory, just start the IDE:

```
code .
```

Check if you can connect to the board through USB:

```
esptool.py --port /dev/ttyUSB0 chip_id
```

### Web UI

```
cd src/web-ui
npm run build
```
