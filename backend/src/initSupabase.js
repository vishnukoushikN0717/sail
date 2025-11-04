const supabase = require('./supabase');

async function initSupabase() {
  try {
    const { data: tables, error: tablesError } = await supabase
      .from('photos')
      .select('*')
      .limit(1);

    if (tablesError && tablesError.code === '42P01') {
      console.log('Photos table does not exist. Please create it in Supabase dashboard.');
      console.log('Run the SQL from SUPABASE-SETUP.md');
    } else {
      console.log('Connected to Supabase successfully');
    }

    // Check and create storage buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (!bucketsError) {
      // Check/create photos bucket
      const photoBucket = buckets.find(b => b.name === 'photos');
      if (!photoBucket) {
        console.log('Creating "photos" storage bucket...');
        const { error: createError } = await supabase
          .storage
          .createBucket('photos', {
            public: true,
            fileSizeLimit: 10485760 // 10MB
          });
        
        if (createError) {
          console.error('Error creating photos bucket:', createError.message);
        } else {
          console.log('✅ Photos bucket created successfully');
        }
      } else {
        console.log('✅ Photos storage bucket ready');
      }

      // Check/create videos bucket
      const videoBucket = buckets.find(b => b.name === 'videos');
      if (!videoBucket) {
        console.log('Creating "videos" storage bucket...');
        const { error: createError } = await supabase
          .storage
          .createBucket('videos', {
            public: true,
            fileSizeLimit: 52428800 // 50MB
          });
        
        if (createError) {
          console.error('Error creating videos bucket:', createError.message);
        } else {
          console.log('✅ Videos bucket created successfully');
        }
      } else {
        console.log('✅ Videos storage bucket ready');
      }
    }
    
  } catch (error) {
    console.error('Error initializing Supabase:', error.message);
    throw error;
  }
}

module.exports = { initSupabase };
