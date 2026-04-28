const app = {
    // Current Active View
    currentView: 'view-dashboard',
    uploadedPhotoHashes: new Set(), // Track uploaded photo hashes
    debugMode: false,
    debugLogs: [],

    // Initialize App
    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.loadAPISettings();
        this.setupDebugConsole();
        console.log("VitalLink Initialized.");
        this.addDebugLog('System', 'VitalLink Application Started', 'success');
    },

    // Update Header Time
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('time-display').textContent = timeString;
    },

    // Navigation Logic
    navigateTo(viewId) {
        // Hide current
        document.getElementById(this.currentView).classList.remove('active');
        document.getElementById(this.currentView).classList.add('hidden');
        
        // Show new
        this.currentView = viewId;
        document.getElementById(this.currentView).classList.remove('hidden');
        document.getElementById(this.currentView).classList.add('active');

        // Special resets based on view
        if (viewId === 'view-dashboard') {
            this.resetHealthCard();
            this.resetChat();
            this.resetAutoFill();
        }
        
        // Load API settings when navigating to API settings view
        if (viewId === 'view-api-settings') {
            this.loadAPISettings();
        }
        
        // Load database settings when navigating to database settings view
        if (viewId === 'view-database-settings') {
            this.loadDatabaseSettings();
        }
    },

    // =====================================================
    // API KEY MANAGEMENT SECTION
    // =====================================================
    
    // Toggle API key visibility (show/hide password)
    toggleKeyVisibility(inputId) {
        const input = document.getElementById(inputId);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
    },

    // Save all API settings to localStorage
    saveAPISettings() {
        const apiKeys = {
            openai: document.getElementById('api-key-openai').value,
            google: document.getElementById('api-key-google').value,
            claude: document.getElementById('api-key-claude').value,
            huggingface: document.getElementById('api-key-huggingface').value,
            customEndpoint: document.getElementById('custom-endpoint').value
        };

        // Save to localStorage
        localStorage.setItem('vitallink_api_keys', JSON.stringify(apiKeys));
        
        // Update status indicators
        this.updateAPIStatus();

        // Show success message
        alert('✓ API Settings saved successfully!');
        console.log('API keys saved to local storage');
    },

    // Load API settings from localStorage
    loadAPISettings() {
        const savedKeys = localStorage.getItem('vitallink_api_keys');
        
        if (savedKeys) {
            try {
                const apiKeys = JSON.parse(savedKeys);
                
                // Load into form inputs
                if (apiKeys.openai) document.getElementById('api-key-openai').value = apiKeys.openai;
                if (apiKeys.google) document.getElementById('api-key-google').value = apiKeys.google;
                if (apiKeys.claude) document.getElementById('api-key-claude').value = apiKeys.claude;
                if (apiKeys.huggingface) document.getElementById('api-key-huggingface').value = apiKeys.huggingface;
                if (apiKeys.customEndpoint) document.getElementById('custom-endpoint').value = apiKeys.customEndpoint;
                
                // Update status indicators
                this.updateAPIStatus();
                console.log('API keys loaded from local storage');
            } catch (error) {
                console.error('Error loading API keys:', error);
            }
        } else {
            // Set default Google API key on first load
            const defaultGoogleKey = 'AIzaSyBhsmnaOPMbHdTPorbL7EENgAENV14Q5UY';
            document.getElementById('api-key-google').value = defaultGoogleKey;
            this.updateAPIStatus();
        }
    },

    // Update API configuration status
    updateAPIStatus() {
        const providers = [
            { id: 'api-key-openai', statusId: 'status-openai' },
            { id: 'api-key-google', statusId: 'status-google' },
            { id: 'api-key-claude', statusId: 'status-claude' },
            { id: 'api-key-huggingface', statusId: 'status-huggingface' }
        ];

        providers.forEach(provider => {
            const input = document.getElementById(provider.id);
            const status = document.getElementById(provider.statusId);
            
            if (input.value.trim()) {
                status.textContent = '✓ Configured';
                status.className = 'api-status configured';
            } else {
                status.textContent = '✗ Not configured';
                status.className = 'api-status not-configured';
            }
        });
    },

    // Clear all API keys from localStorage
    clearAllAPIKeys() {
        const confirm = window.confirm('⚠️  Are you sure you want to clear ALL API keys? This action cannot be undone.');
        
        if (confirm) {
            // Clear form inputs
            document.getElementById('api-key-openai').value = '';
            document.getElementById('api-key-google').value = '';
            document.getElementById('api-key-claude').value = '';
            document.getElementById('api-key-huggingface').value = '';
            document.getElementById('custom-endpoint').value = '';
            
            // Clear from localStorage
            localStorage.removeItem('vitallink_api_keys');
            
            // Update status
            this.updateAPIStatus();
            
            alert('✓ All API keys have been cleared');
            console.log('All API keys cleared from storage');
        }
    },

    // Get a specific API key (used by other modules)
    getAPIKey(provider) {
        const savedKeys = localStorage.getItem('vitallink_api_keys');
        
        if (savedKeys) {
            try {
                const apiKeys = JSON.parse(savedKeys);
                return apiKeys[provider] || null;
            } catch (error) {
                console.error('Error retrieving API key:', error);
                return null;
            }
        }
        return null;
    },

    // =====================================================
    // DATABASE KEY MANAGEMENT SECTION
    // =====================================================

    // Save all database settings to localStorage
    saveDatabaseSettings() {
        const dbKeys = {
            firebase: {
                apiKey: document.getElementById('db-firebase-apikey').value,
                dbUrl: document.getElementById('db-firebase-dburl').value
            },
            mongodb: {
                uri: document.getElementById('db-mongodb-uri').value,
                cluster: document.getElementById('db-mongodb-cluster').value
            },
            postgres: {
                host: document.getElementById('db-postgres-host').value,
                password: document.getElementById('db-postgres-password').value
            },
            mysql: {
                host: document.getElementById('db-mysql-host').value,
                password: document.getElementById('db-mysql-password').value
            },
            supabase: {
                url: document.getElementById('db-supabase-url').value,
                key: document.getElementById('db-supabase-key').value
            }
        };

        localStorage.setItem('vitallink_database_keys', JSON.stringify(dbKeys));
        this.updateDatabaseStatus();
        this.addDebugLog('Database', 'All database credentials saved', 'success');
        alert('✓ Database Settings saved successfully!');
    },

    // Load database settings from localStorage
    loadDatabaseSettings() {
        const savedKeys = localStorage.getItem('vitallink_database_keys');
        
        if (savedKeys) {
            try {
                const dbKeys = JSON.parse(savedKeys);
                
                // Load Firebase
                if (dbKeys.firebase) {
                    if (dbKeys.firebase.apiKey) document.getElementById('db-firebase-apikey').value = dbKeys.firebase.apiKey;
                    if (dbKeys.firebase.dbUrl) document.getElementById('db-firebase-dburl').value = dbKeys.firebase.dbUrl;
                }
                
                // Load MongoDB
                if (dbKeys.mongodb) {
                    if (dbKeys.mongodb.uri) document.getElementById('db-mongodb-uri').value = dbKeys.mongodb.uri;
                    if (dbKeys.mongodb.cluster) document.getElementById('db-mongodb-cluster').value = dbKeys.mongodb.cluster;
                }
                
                // Load PostgreSQL
                if (dbKeys.postgres) {
                    if (dbKeys.postgres.host) document.getElementById('db-postgres-host').value = dbKeys.postgres.host;
                    if (dbKeys.postgres.password) document.getElementById('db-postgres-password').value = dbKeys.postgres.password;
                }
                
                // Load MySQL
                if (dbKeys.mysql) {
                    if (dbKeys.mysql.host) document.getElementById('db-mysql-host').value = dbKeys.mysql.host;
                    if (dbKeys.mysql.password) document.getElementById('db-mysql-password').value = dbKeys.mysql.password;
                }
                
                // Load Supabase
                if (dbKeys.supabase) {
                    if (dbKeys.supabase.url) document.getElementById('db-supabase-url').value = dbKeys.supabase.url;
                    if (dbKeys.supabase.key) document.getElementById('db-supabase-key').value = dbKeys.supabase.key;
                }
                
                this.updateDatabaseStatus();
                this.addDebugLog('Database', 'Database credentials loaded', 'success');
            } catch (error) {
                console.error('Error loading database settings:', error);
                this.addDebugLog('Database', `Error loading settings: ${error.message}`, 'error');
            }
        }
    },

    // Update database configuration status
    updateDatabaseStatus() {
        const providers = [
            { apiKeyId: 'db-firebase-apikey', statusId: 'status-firebase' },
            { uriId: 'db-mongodb-uri', statusId: 'status-mongodb' },
            { hostId: 'db-postgres-host', statusId: 'status-postgres' },
            { hostId: 'db-mysql-host', statusId: 'status-mysql' },
            { urlId: 'db-supabase-url', statusId: 'status-supabase' }
        ];

        // Firebase
        let firebaseStatus = document.getElementById('status-firebase');
        if (document.getElementById('db-firebase-apikey').value.trim()) {
            firebaseStatus.textContent = '✓ Configured';
            firebaseStatus.className = 'database-status configured';
        } else {
            firebaseStatus.textContent = '✗ Not configured';
            firebaseStatus.className = 'database-status not-configured';
        }

        // MongoDB
        let mongoStatus = document.getElementById('status-mongodb');
        if (document.getElementById('db-mongodb-uri').value.trim()) {
            mongoStatus.textContent = '✓ Configured';
            mongoStatus.className = 'database-status configured';
        } else {
            mongoStatus.textContent = '✗ Not configured';
            mongoStatus.className = 'database-status not-configured';
        }

        // PostgreSQL
        let postgresStatus = document.getElementById('status-postgres');
        if (document.getElementById('db-postgres-host').value.trim()) {
            postgresStatus.textContent = '✓ Configured';
            postgresStatus.className = 'database-status configured';
        } else {
            postgresStatus.textContent = '✗ Not configured';
            postgresStatus.className = 'database-status not-configured';
        }

        // MySQL
        let mysqlStatus = document.getElementById('status-mysql');
        if (document.getElementById('db-mysql-host').value.trim()) {
            mysqlStatus.textContent = '✓ Configured';
            mysqlStatus.className = 'database-status configured';
        } else {
            mysqlStatus.textContent = '✗ Not configured';
            mysqlStatus.className = 'database-status not-configured';
        }

        // Supabase
        let supabaseStatus = document.getElementById('status-supabase');
        if (document.getElementById('db-supabase-url').value.trim()) {
            supabaseStatus.textContent = '✓ Configured';
            supabaseStatus.className = 'database-status configured';
        } else {
            supabaseStatus.textContent = '✗ Not configured';
            supabaseStatus.className = 'database-status not-configured';
        }
    },

    // Clear all database keys
    clearAllDatabaseKeys() {
        const confirm = window.confirm('⚠️  Are you sure you want to clear ALL database credentials? This action cannot be undone.');
        
        if (confirm) {
            document.getElementById('db-firebase-apikey').value = '';
            document.getElementById('db-firebase-dburl').value = '';
            document.getElementById('db-mongodb-uri').value = '';
            document.getElementById('db-mongodb-cluster').value = '';
            document.getElementById('db-postgres-host').value = '';
            document.getElementById('db-postgres-password').value = '';
            document.getElementById('db-mysql-host').value = '';
            document.getElementById('db-mysql-password').value = '';
            document.getElementById('db-supabase-url').value = '';
            document.getElementById('db-supabase-key').value = '';
            
            localStorage.removeItem('vitallink_database_keys');
            this.updateDatabaseStatus();
            this.addDebugLog('Database', 'All database credentials cleared', 'success');
            alert('✓ All database credentials have been cleared');
        }
    },

    // Toggle database key visibility
    toggleDbKeyVisibility(...ids) {
        ids.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    },

    // Get specific database key
    getDatabaseKey(provider, field = null) {
        const savedKeys = localStorage.getItem('vitallink_database_keys');
        
        if (savedKeys) {
            try {
                const dbKeys = JSON.parse(savedKeys);
                if (field) {
                    return dbKeys[provider]?.[field] || null;
                }
                return dbKeys[provider] || null;
            } catch (error) {
                console.error('Error retrieving database key:', error);
                return null;
            }
        }
        return null;
    },

    // Test database connections
    testDatabaseConnections() {
        const resultDiv = document.getElementById('connection-test-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="color: var(--cyan);">🔄 Testing connections...</p>';
        this.addDebugLog('Database', 'Testing database connections', 'info');

        const results = [];

        // Check Firebase
        const firebaseApiKey = document.getElementById('db-firebase-apikey').value;
        if (firebaseApiKey) {
            results.push(`✓ <strong>Firebase:</strong> Credentials configured (validation skipped in browser)`);
        } else {
            results.push(`✗ <strong>Firebase:</strong> No credentials configured`);
        }

        // Check MongoDB
        const mongoUri = document.getElementById('db-mongodb-uri').value;
        if (mongoUri) {
            results.push(`✓ <strong>MongoDB:</strong> Connection string configured (connection test requires server)`);
        } else {
            results.push(`✗ <strong>MongoDB:</strong> No connection string configured`);
        }

        // Check PostgreSQL
        const postgresHost = document.getElementById('db-postgres-host').value;
        if (postgresHost) {
            results.push(`✓ <strong>PostgreSQL:</strong> Host configured (connection test requires server)`);
        } else {
            results.push(`✗ <strong>PostgreSQL:</strong> No host configured`);
        }

        // Check MySQL
        const mysqlHost = document.getElementById('db-mysql-host').value;
        if (mysqlHost) {
            results.push(`✓ <strong>MySQL:</strong> Host configured (connection test requires server)`);
        } else {
            results.push(`✗ <strong>MySQL:</strong> No host configured`);
        }

        // Check Supabase
        const supabaseUrl = document.getElementById('db-supabase-url').value;
        if (supabaseUrl) {
            results.push(`✓ <strong>Supabase:</strong> URL configured (connection test requires server)`);
        } else {
            results.push(`✗ <strong>Supabase:</strong> No URL configured`);
        }

        setTimeout(() => {
            resultDiv.innerHTML = `
                <p style="color: var(--text-secondary);">
                    <strong>Connection Status Report:</strong><br><br>
                    ${results.join('<br>')}
                    <br><br>
                    <em style="color: var(--text-secondary);">Note: Full connection testing requires backend server. This shows credential configuration status.</em>
                </p>
            `;
            this.addDebugLog('Database', 'Connection tests completed', 'success');
        }, 1000);
    },

    // =====================================================

    // =====================================================
    // DEBUG CONSOLE & LOGGING
    // =====================================================

    setupDebugConsole() {
        // Intercept console.log
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(...args);
            this.addDebugLog('Console', args.join(' '), 'info');
        };

        // Intercept console.error
        const originalError = console.error;
        console.error = (...args) => {
            originalError(...args);
            this.addDebugLog('Error', args.join(' '), 'error');
        };
    },

    addDebugLog(source, message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logEntry = `[${timestamp}] ${source}: ${message}`;
        
        this.debugLogs.push({
            source,
            message,
            type,
            timestamp
        });

        // Keep only last 50 logs
        if (this.debugLogs.length > 50) {
            this.debugLogs.shift();
        }

        this.updateDebugConsole();
    },

    updateDebugConsole() {
        const debugContent = document.getElementById('debug-content');
        if (!debugContent) return;

        debugContent.innerHTML = this.debugLogs.map(log => {
            const className = log.type === 'error' ? 'debug-log-error' : 
                            log.type === 'success' ? 'debug-log-success' : 'debug-log-info';
            return `<p class="${className}">[${log.timestamp}] <strong>${log.source}:</strong> ${log.message}</p>`;
        }).join('');

        // Auto scroll to bottom
        debugContent.scrollTop = debugContent.scrollHeight;
    },

    toggleDebugConsole() {
        const debugConsole = document.getElementById('debug-console');
        debugConsole.classList.toggle('active');
        debugConsole.classList.toggle('closed');
        this.debugMode = debugConsole.classList.contains('active');
    },

    // =====================================================
    // Generate hash from photo file
    generatePhotoHash(file, callback) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target.result;
                const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer));
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                callback(hashHex);
            } catch (error) {
                console.error('Error generating photo hash:', error);
                callback(null);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    // Display health card after validation
    displayHealthCard(name, dob, blood, allergies, contact, patientContact, address, photoInput) {
        // Set display values
        document.getElementById('display-name').textContent = name;
        document.getElementById('display-dob').textContent = dob;
        document.getElementById('display-blood').textContent = blood;
        document.getElementById('display-allergies').textContent = allergies;
        document.getElementById('display-contact').textContent = contact;
        document.getElementById('display-patient-contact').textContent = patientContact;
        document.getElementById('display-address').textContent = address;

        // Handle Photo
        if (photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('display-photo').src = e.target.result;
                document.getElementById('display-photo').style.display = 'block';
                document.getElementById('default-photo-icon').style.display = 'none';
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            document.getElementById('display-photo').src = "";
            document.getElementById('display-photo').style.display = 'none';
            document.getElementById('default-photo-icon').style.display = 'block';
        }

        // Toggle visibility
        document.getElementById('card-placeholder').style.display = 'none';
        document.getElementById('generated-card').style.display = 'block';
    },

    generateHealthCard(event) {
        event.preventDefault();
        
        // Get values
        const name = document.getElementById('hc-name').value;
        const dob = document.getElementById('hc-dob').value;
        const blood = document.getElementById('hc-blood').value;
        const allergies = document.getElementById('hc-allergies').value || 'None';
        const contact = document.getElementById('hc-contact').value;
        const patientContact = document.getElementById('hc-patient-contact').value;
        const address = document.getElementById('hc-address').value;
        const photoInput = document.getElementById('hc-photo');

        // Validation: Check if address is provided
        if (!address || address.trim().length < 10) {
            alert('Patient Address is mandatory and must be at least 10 characters');
            return;
        }

        // Validation: Check if photo is selected
        if (!photoInput.files || photoInput.files.length === 0) {
            alert('Patient Photo is mandatory. Please select a photo.');
            return;
        }

        // Validation: Check if Emergency Contact and Patient Contact are not the same
        if (contact.trim() === patientContact.trim()) {
            alert('Emergency Contact and Patient Contact Number cannot be the same. Please enter different numbers.');
            return;
        }

        // Validation: Check if photo is duplicate
        const photoFile = photoInput.files[0];
        this.generatePhotoHash(photoFile, (photoHash) => {
            if (photoHash && this.uploadedPhotoHashes.has(photoHash)) {
                alert('This photo has already been used for another patient. Please select a different photo.');
                return;
            }
            
            if (photoHash) {
                this.uploadedPhotoHashes.add(photoHash);
            }
            
            this.displayHealthCard(name, dob, blood, allergies, contact, patientContact, address, photoInput);
        });
    },

    resetHealthCard() {
        document.getElementById('health-card-form').reset();
        document.getElementById('card-placeholder').style.display = 'flex';
        document.getElementById('generated-card').style.display = 'none';
        document.getElementById('display-photo').src = "";
        document.getElementById('display-photo').style.display = 'none';
        document.getElementById('default-photo-icon').style.display = 'block';
    },

    // -----------------------------------------------------
    // MODULE 2: EMERGENCY AI ADMISSION
    // -----------------------------------------------------
    isRecording: false,

    toggleVoiceInput() {
        this.isRecording = !this.isRecording;
        const btn = document.getElementById('btn-voice');
        const input = document.getElementById('chat-input');
        
        if (this.isRecording) {
            btn.classList.add('recording');
            input.placeholder = "Listening...";
            input.disabled = true;
            
            // Simulate voice ending after 3 seconds
            setTimeout(() => {
                if (this.isRecording) {
                    this.toggleVoiceInput();
                    input.value = "Patient is experiencing severe chest pain and shortness of breath.";
                    this.sendChatMessage();
                }
            }, 3000);
        } else {
            btn.classList.remove('recording');
            input.placeholder = "Type symptoms here...";
            input.disabled = false;
        }
    },

    handleChatEnter(event) {
        if (event.key === 'Enter') {
            this.sendChatMessage();
        }
    },

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        
        if (!text) return;

        // Append user message
        this.appendMessage('user', text);
        input.value = '';
        input.disabled = true;

        this.showTypingIndicator();

        // Check if Google API key is configured
        const googleApiKey = this.getAPIKey('google');
        
        if (googleApiKey) {
            // Use real Google AI API
            this.callGoogleAI(text);
        } else {
            // Fallback to simulated response
            const delay = Math.floor(Math.random() * 1000) + 1200;
            setTimeout(() => {
                this.hideTypingIndicator();
                this.simulateAiResponse(text);
                input.disabled = false;
                input.focus();
            }, delay);
        }
    },

    // Call Google Gemini AI API
    callGoogleAI(userMessage) {
        const googleApiKey = this.getAPIKey('google');
        
        if (!googleApiKey) {
            console.error('No Google API key found');
            this.hideTypingIndicator();
            this.appendMessage('ai', 'Error: Google API key not configured.');
            document.getElementById('chat-input').disabled = false;
            return;
        }

        // Using the correct API endpoint
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`;

        const systemPrompt = `You are an Emergency Medical Triage Assistant AI. Your role is to:
1. Listen to patient symptoms carefully
2. Perform rapid triage assessment
3. Identify critical conditions and recommended hospital types
4. Provide concise emergency guidance

Format your response CONCISELY with:
- Initial assessment and severity level
- Key symptoms identified
- Recommended hospital type or facility
- Critical actions needed

Keep response under 100 words for rapid assessment in emergencies.`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nPatient symptoms: ${userMessage}`
                }]
            }]
        };

        this.addDebugLog('AI', `Calling Gemini API with message: "${userMessage}"`, 'info');

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            this.addDebugLog('AI', `API Response status: ${response.status}`, 'info');
            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                return response.text().then(text => {
                    this.addDebugLog('AI', `HTTP Error: ${response.status}`, 'error');
                    throw new Error(`API Error ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            this.addDebugLog('AI', 'API Response received successfully', 'success');
            console.log('API Response data:', data);
            this.hideTypingIndicator();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const aiText = data.candidates[0].content.parts[0].text;
                this.addDebugLog('AI', 'AI Response generated', 'success');
                console.log('AI Response:', aiText);
                this.appendMessage('ai', aiText);
                
                // Check if response mentions critical conditions for summary
                const lowerText = aiText.toLowerCase();
                if (lowerText.includes('critical') || lowerText.includes('severe') || lowerText.includes('emergency')) {
                    this.generateSummary(aiText, this.getRecommendedHospitals(lowerText));
                    document.getElementById('ai-placeholder').style.display = 'none';
                    document.getElementById('summary-panel').style.display = 'block';
                }
            } else {
                console.error('Unexpected API response structure:', data);
                this.addDebugLog('AI', 'Invalid response structure from API', 'error');
                throw new Error('Unexpected API response format');
            }
            
            document.getElementById('chat-input').disabled = false;
            document.getElementById('chat-input').focus();
        })
        .catch(error => {
            console.error('Google AI API Error:', error.message, error);
            this.addDebugLog('AI', `Error: ${error.message}`, 'error');
            this.hideTypingIndicator();
            this.appendMessage('ai', `⚠️ Error: ${error.message}\n\nFalling back to standard assessment...`);
            
            // Fallback to simulation after short delay
            setTimeout(() => {
                this.simulateAiResponse(userMessage);
            }, 500);
            
            document.getElementById('chat-input').disabled = false;
            document.getElementById('chat-input').focus();
        });
    },

    // Get recommended hospitals based on symptoms
    getRecommendedHospitals(textLower) {
        if (textLower.includes('heart') || textLower.includes('cardiac') || textLower.includes('chest')) {
            return [
                { name: "City General Hospital (Cardiac Unit)", distance: "1.2 miles", eta: "4 mins" },
                { name: "St. Jude Medical Center", distance: "3.5 miles", eta: "8 mins" }
            ];
        } else if (textLower.includes('burn') || textLower.includes('fire')) {
            return [
                { name: "Metro Regional Burn Center", distance: "4.0 miles", eta: "10 mins" },
                { name: "City General Hospital", distance: "1.2 miles", eta: "4 mins" }
            ];
        } else if (textLower.includes('trauma') || textLower.includes('bleed') || textLower.includes('accident')) {
            return [
                { name: "County Level 1 Trauma Center", distance: "2.1 miles", eta: "6 mins" },
                { name: "City General Hospital", distance: "4.5 miles", eta: "12 mins" }
            ];
        } else if (textLower.includes('breath') || textLower.includes('respiratory')) {
            return [
                { name: "St. Jude Medical Center", distance: "1.5 miles", eta: "5 mins" },
                { name: "Westside Emergency Clinic", distance: "2.0 miles", eta: "7 mins" }
            ];
        } else {
            return [
                { name: "Nearest Emergency Room", distance: "1.0 miles", eta: "3 mins" },
                { name: "City General Hospital", distance: "2.5 miles", eta: "7 mins" }
            ];
        }
    },

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai typing-message';
        msgDiv.id = 'typing-indicator';
        msgDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    },

    appendMessage(sender, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    simulateAiResponse(userText) {
        const textLower = userText.toLowerCase();
        this.addDebugLog('AI', 'Using fallback simulation (Google API likely blocked by CORS)', 'info');
        
        let aiResponse = "";
        let showSummary = false;
        let condition = "";
        let hospitals = [];

        // Extract patient info
        const ageMatch = textLower.match(/(\d+)\s*(years|yr|y\.o|age)/);
        const ageExtracted = ageMatch ? ageMatch[1] : "Unknown";
        const genderExtracted = textLower.includes("female") || textLower.includes("woman") || textLower.includes("she") ? "Female" :
                               textLower.includes("male") || textLower.includes("man") || textLower.includes("he") ? "Male" : "Unknown";

        let patientInfo = "";
        if (ageExtracted !== "Unknown" || genderExtracted !== "Unknown") {
            patientInfo = `<br><span style="font-size:0.85em; color:var(--cyan);">Patient: ${ageExtracted}y/o ${genderExtracted}</span>`;
        }

        // Cardiac emergencies
        if (textLower.includes("chest") || textLower.includes("heart") || textLower.includes("cardiac")) {
            const responses = [
                "🚨 CRITICAL: Acute cardiac event suspected. Patient experiencing chest discomfort with potential MI characteristics. Immediate EKG and troponin testing required.",
                "⚠️  Cardiac Alert: Chest pain reported. Assess for radiation, associated symptoms (SOB, nausea). Risk stratification essential. Consider ACS protocol.",
                "🏥 Cardiac evaluation needed: Chest symptoms detected. Vital signs monitoring, oxygen therapy standby. Transport to cardiac center immediately."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Acute Coronary Syndrome (ACS) suspected. Immediate cardiac intervention required.";
            hospitals = [
                { name: "City General Hospital (Cardiac Unit)", distance: "1.2 miles", eta: "4 mins" },
                { name: "St. Jude Medical Center - Cath Lab", distance: "3.5 miles", eta: "8 mins" }
            ];
            showSummary = true;
        }
        // Respiratory emergencies
        else if (textLower.includes("breath") || textLower.includes("respiratory") || textLower.includes("asthma") || textLower.includes("pneumonia")) {
            const responses = [
                "🫁 RESPIRATORY ALERT: Breathing difficulty detected. Assess oxygen saturation, stridor presence, accessory muscle use. Airway management readiness.",
                "⚠️  Respiratory Distress: Patient with compromised airway or breathing pattern. Supplemental oxygen initiated. Monitor SpO2 closely.",
                "🚨 Severe Respiratory Compromise: Immediate airway assessment required. Prepare for potential intubation. Emergency respiratory support standby."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Acute Respiratory Distress/Failure. Airway management priority.";
            hospitals = [
                { name: "St. Jude Medical Center (ICU)", distance: "1.5 miles", eta: "5 mins" },
                { name: "Westside Emergency Clinic", distance: "2.0 miles", eta: "7 mins" }
            ];
            showSummary = true;
        }
        // Trauma/bleeding
        else if (textLower.includes("trauma") || textLower.includes("accident") || textLower.includes("crash") || textLower.includes("bleed") || textLower.includes("injury")) {
            const responses = [
                "🚨 TRAUMA ALERT: Significant mechanism of injury. Control bleeding, assess for internal injuries. Hemorrhage control protocols activated.",
                "⚠️  Major Trauma: Multiple injuries suspected. Perform rapid primary survey. FAST exam and imaging priority for occult bleeding.",
                "🏥 Trauma Evaluation: Significant injury reported. Immobilization and hemorrhage control. Level 1 trauma center transport required."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Major Trauma/Polytrauma. Hemorrhage control and emergency imaging required.";
            hospitals = [
                { name: "County Level 1 Trauma Center", distance: "2.1 miles", eta: "6 mins" },
                { name: "City General Hospital", distance: "4.5 miles", eta: "12 mins" }
            ];
            showSummary = true;
        }
        // Burns
        else if (textLower.includes("burn") || textLower.includes("fire") || textLower.includes("scald")) {
            const responses = [
                "🔥 BURN ALERT: Thermal injury sustained. Determine burn depth and percentage. Fluid resuscitation protocol. Specialist burn center transport.",
                "⚠️  Significant Burns: Assess TBSA (Total Body Surface Area). Cool burn area, remove constrictive clothing. Pain management and monitoring.",
                "🚨 Severe Burn Injury: Extensive thermal damage. Airway compromise risk (inhalation injury). Emergency burn center transport mandatory."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Thermal burn injury. Specialist burn center required.";
            hospitals = [
                { name: "Metro Regional Burn Center", distance: "4.0 miles", eta: "10 mins" },
                { name: "City General Hospital", distance: "1.2 miles", eta: "4 mins" }
            ];
            showSummary = true;
        }
        // Neurological
        else if (textLower.includes("stroke") || textLower.includes("seizure") || textLower.includes("paralysis") || textLower.includes("weakness")) {
            const responses = [
                "🧠 NEUROLOGICAL ALERT: Acute CNS event suspected. Determine symptom onset time (critical for intervention window). NIHSS assessment.",
                "⚠️  Stroke Protocol: Acute neurological deficit detected. Rapid CT/MRI needed. Time-critical intervention possible.",
                "🚨 Possible Acute Stroke: Sudden onset neurological symptoms. Within treatment window possible. Activate stroke team alert."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Acute CVA (Cerebrovascular Accident) suspected. Time-critical intervention may be available.";
            hospitals = [
                { name: "City General Hospital (Stroke Center)", distance: "2.5 miles", eta: "7 mins" },
                { name: "St. Jude Medical Center (Neuro Unit)", distance: "3.0 miles", eta: "9 mins" }
            ];
            showSummary = true;
        }
        // Abdominal
        else if (textLower.includes("abdominal") || textLower.includes("stomach") || textLower.includes("belly")) {
            const responses = [
                "🏥 Abdominal Assessment: Acute abdomen suspected. Assess tenderness, rigidity, guarding. Imaging and labs ordered.",
                "⚠️  Acute Abdominal Pain: Determine characteristics - location, onset, severity. Evaluate for surgical emergency.",
                "🚨 Acute Abdomen: Severe pain with concerning features. Surgical consultation standby. Emergency room transfer."
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
            condition = "Acute Abdomen. Surgical evaluation may be required.";
            hospitals = [
                { name: "City General Hospital (Surgery Dept)", distance: "2.0 miles", eta: "6 mins" },
                { name: "St. Jude Medical Center", distance: "2.8 miles", eta: "8 mins" }
            ];
            showSummary = true;
        }
        // Non-emergency
        else {
            const responses = [
                "📋 General Assessment: Symptom details noted. Can you provide additional information? Duration, severity, associated symptoms?",
                "🔍 Further Details Needed: Initial assessment logged. What is the primary complaint? Any vital sign changes?",
                "📝 Symptom Recording: Information received. Please describe the onset - was it sudden or gradual?"
            ];
            aiResponse = responses[Math.floor(Math.random() * responses.length)] + patientInfo;
        }

        this.appendMessage('ai', aiResponse);

        if (showSummary) {
            this.generateSummary(condition, hospitals);
            document.getElementById('ai-placeholder').style.display = 'none';
            document.getElementById('summary-panel').style.display = 'block';
        }
    },

    generateSummary(condition, hospitals) {
        // Populate Summary
        const summaryDiv = document.getElementById('ai-summary');
        summaryDiv.innerHTML = `<p class="text-red font-bold">CRITICAL ALERT</p><p>${condition}</p>`;

        // Populate Hospitals
        const hospitalDiv = document.getElementById('hospital-recommendations');
        hospitalDiv.innerHTML = hospitals.map(h => `
            <div class="hospital-card">
                <div>
                    <h4>${h.name}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-secondary)">${h.distance}</span>
                </div>
                <div class="eta">ETA: ${h.eta}</div>
            </div>
        `).join('');
    },

    dispatchAmbulance() {
        alert("Ambulance dispatched to your current location!");
    },

    resetChat() {
        const messages = document.getElementById('chat-messages');
        messages.innerHTML = `<div class="message ai"><p>Emergency Triage Activated. Please describe the patient's symptoms via text or use voice input.</p></div>`;
        document.getElementById('ai-placeholder').style.display = 'flex';
        document.getElementById('summary-panel').style.display = 'none';
    },

    // -----------------------------------------------------
    // MODULE 3: AUTO FORM FILL
    // -----------------------------------------------------
    simulateScan() {
        const btn = document.getElementById('btn-scan');
        const progress = document.getElementById('scan-progress');
        
        btn.style.display = 'none';
        progress.style.display = 'flex';

        setTimeout(() => {
            progress.style.display = 'none';
            btn.style.display = 'flex';
            
            // Auto fill form
            document.getElementById('af-id').value = "PT-8894-X";
            document.getElementById('af-fname').value = "Sarah";
            document.getElementById('af-lname').value = "Connor";
            document.getElementById('af-age').value = "34";
            document.getElementById('af-gender').value = "Female";
            document.getElementById('af-blood').value = "O-";
            document.getElementById('af-history').value = "Previous appendectomy (2018). No known allergies.";
            
        }, 2000);
    },

    resetAutoFill() {
        document.getElementById('auto-fill-form').reset();
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
