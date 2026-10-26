import Foundation
// reads lines from stdin, writes each converted from Simplified to Traditional Chinese (ICU Hans-Hant)
while let line = readLine(strippingNewline: true) {
  print(line.applyingTransform(StringTransform("Hans-Hant"), reverse: false) ?? line)
}
