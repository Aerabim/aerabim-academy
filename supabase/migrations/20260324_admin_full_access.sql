-- Admin users can read ALL courses regardless of status
CREATE POLICY "Admins can read all courses" ON courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin users can read ALL modules regardless of course status
CREATE POLICY "Admins can read all modules" ON modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin users can read ALL lessons regardless of enrollment or preview status
CREATE POLICY "Admins can read all lessons" ON lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
