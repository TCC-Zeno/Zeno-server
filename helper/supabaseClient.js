import {createClient} from "@supabase/supabase-js";

const supabaseURL = "https://hftlavugxgkarecjykea.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdGxhdnVneGdrYXJlY2p5a2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTM0MDQsImV4cCI6MjA2MDI4OTQwNH0.1Jx9zOLssoIrJzkGp7YwZadvCshD5Fd2XpcMq75kg1w";

const supabase = createClient(supabaseURL, supabaseAnonKey);
export default supabase;