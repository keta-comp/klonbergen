
INSERT INTO storage.buckets (id, name, public) VALUES ('hall-assets', 'hall-assets', true);

CREATE POLICY "Anyone can view hall assets" ON storage.objects FOR SELECT USING (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can upload hall assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can update hall assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hall-assets');
CREATE POLICY "Authenticated users can delete hall assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hall-assets');
