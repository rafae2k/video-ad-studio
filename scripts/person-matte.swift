import Foundation
import AVFoundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

// Usage: swift person-matte.swift source.mp4 masks-dir reviews-dir start-frame end-exclusive [fps]
let args = CommandLine.arguments
 guard args.count >= 6 else { fatalError("Usage: source.mp4 masks-dir reviews-dir start-frame end-exclusive [fps]") }
let source = URL(fileURLWithPath: args[1])
let masks = URL(fileURLWithPath: args[2], isDirectory: true)
let reviews = URL(fileURLWithPath: args[3], isDirectory: true)
let start = Int(args[4])!, end = Int(args[5])!, fps = args.count > 6 ? Int32(args[6])! : 30
try FileManager.default.createDirectory(at: masks, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: reviews, withIntermediateDirectories: true)
let asset = AVURLAsset(url: source)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
let context = CIContext()
let request = VNGenerateForegroundInstanceMaskRequest()
let colorSpace = CGColorSpaceCreateDeviceRGB()
let began = Date()
var records: [[String: Any]] = []
func save(_ image: CIImage, _ url: URL) throws {
    try context.writePNGRepresentation(of: image, to: url, format: .RGBA8, colorSpace: colorSpace)
}
for frame in start..<end {
    try autoreleasepool {
        var actual = CMTime.zero
        let cg = try generator.copyCGImage(at: CMTime(value: Int64(frame), timescale: fps), actualTime: &actual)
        let original = CIImage(cgImage: cg)
        let handler = VNImageRequestHandler(cgImage: cg, options: [:])
        try handler.perform([request])
        guard let result = request.results?.first else { throw NSError(domain: "matte", code: 1) }
        let buffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
        let raw = CIImage(cvPixelBuffer: buffer)
        let extent = CGRect(x: 0, y: 0, width: 540, height: 960)
        let mask = raw.transformed(by: CGAffineTransform(scaleX: 540 / raw.extent.width, y: 960 / raw.extent.height)).cropped(to: extent)
        let name = String(format: "frame-%06d.png", frame)
        try save(mask, masks.appendingPathComponent(name))
        let scaled = original.transformed(by: CGAffineTransform(scaleX: 540 / original.extent.width, y: 960 / original.extent.height)).cropped(to: extent)
        // A saturated background makes edge spill, missing body parts and holes easy to inspect.
        let background = CIImage(color: CIColor(red: 0.08, green: 0.22, blue: 0.30)).cropped(to: extent)
        let composite = scaled.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: background, kCIInputMaskImageKey: mask])
        try save(composite, reviews.appendingPathComponent(name))
        if frame == start || frame == (start+end)/2 || frame == end-1 {
            try save(scaled, reviews.appendingPathComponent(String(format: "source-%06d.png", frame)))
        }
        records.append(["sourceFrame": frame, "sourceTimeSeconds": Double(frame)/Double(fps), "decodedTimeSeconds": actual.seconds, "mask": name])
        if (frame-start) % 15 == 0 { print("Processed source frame \(frame); elapsed \(Int(Date().timeIntervalSince(began)))s"); fflush(stdout) }
    }
}
let manifest: [String: Any] = ["status": "draft", "backend": "Apple Vision VNGenerateForegroundInstanceMaskRequest", "quality": "native-instance-mask", "source": source.path, "fps": fps, "startFrame": start, "endFrameExclusive": end, "width": 540, "height": 960, "maskEncoding": "RGBA grayscale; use luminance as alpha, not the PNG alpha channel", "elapsedSeconds": Date().timeIntervalSince(began), "frames": records]
let data = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try data.write(to: reviews.appendingPathComponent("manifest.json"))
print("Finished \(end-start) masks in \(Date().timeIntervalSince(began))s")
